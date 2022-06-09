import { Sequelize, QueryTypes } from 'sequelize';

import { log } from 'shared/services/logging';
import { PatientAdditionalData } from 'shared/models';

const METADATA_COLUMNS = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'patientId',
  'markedForPush',
  'pushedAt',
  'pulledAt',
  'isPushing',
  'mergedIntoId',
];

export async function reconcilePatient(sequelize, patientId) {
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
  const checkedRecords = patientAdditionalDataRecords.map(record => ({
    record,
    canonical: false,
    hasData: Object.keys(record.dataValues).some(col => {
      if (METADATA_COLUMNS.includes(col)) return false;
      const value = record[col];
      if (value === undefined || value === null || value === '') return false;
      return true;
    }),
  }));

  // figure out the canonical record - the first one with data if there is one, otherwise just go with the first one
  const canonicalRecord = checkedRecords.find(x => x.hasData) || checkedRecords[0];

  // Perhaps overly paranoid, but worth checking in case there's a race condition between
  // querying the patient in the batch and querying their addtl data records here
  if (!canonicalRecord) {
    throw new Error(`No canonical record found for patientId ${patientId}`);
  }

  canonicalRecord.canonical = true;

  // delete the ones we can
  const idsToDelete = checkedRecords
    .filter(record => !record.canonical && !record.hasData)
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

  // warn if there are any OTHER records with data, which will need to be resolved manually
  // TODO: more intelligent merge logic
  const unmergeable = checkedRecords.filter(record => !record.canonical && record.hasData);
  if (unmergeable.length > 0) {
    log.warn(
      `Patient ${patientId} has ${unmergeable.length} PatientAdditionalData records that need manual reconciliation`,
    );
  }

  // return some tallies for reporting
  return {
    unmergeable: unmergeable.length,
    deleted: idsToDelete.length,
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

  log.info(`Starting removal of duplicate PatientAdditionalData`, { batchCount, total: patientIdsCount });

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
