import { Sequelize, QueryTypes } from 'sequelize';

import { log } from 'shared/services/logging';
import { PatientAdditionalData } from 'shared/models';
import { getLocalisation } from '../localisation';

const METADATA_COLUMNS = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'patientId',
  'mergedIntoId',
];

// function to check for unset values (can't just check for falsiness as we don't want to overwrite 0s)
const isBlank = value => value === undefined || value === null || value === '';

export async function reconcilePatient(sequelize, patientId) {
  const { mergePopulatedPADRecords } = (await getLocalisation()).features;

  // find all the records for this patient
  const patientAdditionalDataRecords = await sequelize.query(
    `
    SELECT *
    FROM patient_additional_data
    WHERE deleted_at IS NULL AND patient_id = :patientId
    ORDER BY updated_at;
  `,
    {
      model: PatientAdditionalData,
      type: QueryTypes.SELECT,
      mapToModel: true,
      replacements: { patientId },
    },
  );

  // get all the records that have actual data against them
  const checkedRecords = patientAdditionalDataRecords.map(record => {
    const populatedKeys = Object.keys(record.dataValues).filter(col => {
      if (METADATA_COLUMNS.includes(col)) return false;
      const value = record[col];
      if (isBlank(value)) return false;
      return true;
    });
    return {
      record,
      merged: false,
      canonical: false,
      populatedKeys,
      hasData: populatedKeys.length > 0,
    };
  });

  // figure out the canonical record - the first one with data if there is one, otherwise just go with the first one
  const canonicalRecord = checkedRecords.find(x => x.hasData) || checkedRecords[0];

  // Perhaps overly paranoid, but worth checking in case there's a race condition between
  // querying the patient in the batch and querying their addtl data records here
  if (!canonicalRecord) {
    throw new Error(`No canonical record found for patientId ${patientId}`);
  }
  canonicalRecord.canonical = true;

  // now we merge extra records into the canonical one
  const recordsToMerge = checkedRecords.filter(record => !record.canonical);

  // this will track the new values we want to merge in
  const valuesToMerge = {};
  const existingValues = {};
  for (const k of canonicalRecord.populatedKeys) {
    existingValues[k] = canonicalRecord.record.dataValues[k];
  }

  const unmergeableRecords = [];

  for (const record of recordsToMerge) {
    const values = {};
    let canMerge = true;
    if (mergePopulatedPADRecords) {
      for (const k of record.populatedKeys) {
        const incomingValue = record.record.dataValues[k];
        const existingValue = existingValues[k];
        if (isBlank(existingValue)) {
          // we can happily overwrite a blank
          values[k] = incomingValue;
        } else if (existingValue !== incomingValue) {
          // we can't overwrite actual values
          canMerge = false;
          break;
        }
      }
    } else {
      // with the feature off, any populated keys will prevent a merge
      canMerge = record.populatedKeys.length === 0;
    }

    if (canMerge) {
      Object.assign(valuesToMerge, values);
      Object.assign(existingValues, values);
      record.merged = true;
    } else {
      unmergeableRecords.push(record);
    }
  }

  if (unmergeableRecords.length > 0) {
    log.warn(
      `Patient ${patientId} has ${unmergeableRecords.length} PatientAdditionalData records that need manual reconciliation`,
    );
  }

  // update the canonical record with the merged values
  const updatedKeys = Object.keys(valuesToMerge);
  if (mergePopulatedPADRecords) {
    if (updatedKeys.length > 0) {
      log.info(`Updating ${updatedKeys.length} new additional data keys`, {
        patientId,
        keys: updatedKeys,
        canonicalId: canonicalRecord.record.id,
      });
      await PatientAdditionalData.update(
        {
          updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
          ...valuesToMerge,
        },
        {
          where: {
            id: canonicalRecord.record.id,
          },
        },
      );
    }
  }

  // delete the ones we can
  const idsToDelete = checkedRecords
    .filter(record => record.merged)
    .map(record => record.record.id);
  if (idsToDelete.length > 0) {
    log.info(`Merging ${idsToDelete.length} records`, {
      patientId,
      canonicalId: canonicalRecord.record.id,
    });
    await PatientAdditionalData.update(
      {
        mergedIntoId: canonicalRecord.record.id,
        deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: {
          id: idsToDelete,
        },
      },
    );
  }

  // return some info for reporting
  return {
    unmergeable: unmergeableRecords.length,
    deleted: idsToDelete.length,
    updatedKeys,
    blank: recordsToMerge.filter(x => !x.hasData).length,
  };
}

export async function countAffectedPatients(sequelize) {
  const [patientIdsCountData] = await sequelize.query(`
      SELECT COUNT(*)
      FROM (
        SELECT patient_id
          FROM patient_additional_data
          WHERE deleted_at IS NULL
          GROUP BY patient_id
          HAVING COUNT(patient_id) > 1
      ) patientIds;
  `);

  return patientIdsCountData[0].count;
}

export async function removeDuplicatedPatientAdditionalData(sequelize) {
  const patientIdsCount = await countAffectedPatients(sequelize);
  const batchSize = 1000;
  const batchCount = Math.ceil(patientIdsCount / batchSize);

  log.info(`Starting removal of duplicate PatientAdditionalData`, {
    batchCount,
    total: patientIdsCount,
  });

  let cursor = '';
  const tallies = {
    patients: 0,
    unmergeable: 0,
    errors: 0,
    deleted: 0,
  };

  // Run in batches to avoid OOM issue
  for (let i = 0; i < batchCount; i++) {
    // fetch the next list of patients
    const [patients] = await sequelize.query(
      `
      SELECT patient_id
        FROM (
          SELECT patient_id
            FROM patient_additional_data
            WHERE deleted_at IS NULL
        ) AS existing_patient_additional_data
      WHERE patient_id > :cursor
      GROUP BY patient_id
      HAVING COUNT(1) > 1
      ORDER BY patient_id
      LIMIT :batchSize;
    `,
      {
        replacements: {
          cursor,
          batchSize,
        },
      },
    );

    log.info(`Starting a batch of ${patients.length} patients`, {
      startId: patients[0].patient_id,
    });
    for (const patient of patients) {
      const patientId = patient.patient_id;
      try {
        const { deleted, unmergeable } = await reconcilePatient(sequelize, patientId);
        tallies.deleted += deleted;
        tallies.unmergeable += unmergeable;
      } catch (e) {
        log.error('Error encountered when reconciling data', { patientId, error: e });
        tallies.errors += 1;
      }
      tallies.patients += 1;

      // update the cursor so we don't get stuck on errors or unmergeable records
      cursor = patientId;
    }
  }

  log.info('Finished merging records', tallies);

  return tallies;
}
