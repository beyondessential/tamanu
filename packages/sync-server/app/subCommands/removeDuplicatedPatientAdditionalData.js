import { Command } from 'commander';
import { Sequelize, QueryTypes } from 'sequelize';

import { log } from 'shared/services/logging';
import { PatientAdditionalData } from 'shared/models';

import { initDatabase } from '../database';

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
  const patientAdditionalDataRecords = await sequelize.query(`
    SELECT *
    FROM patient_additional_data
    WHERE deleted_at IS NULL AND patient_id = :patientId
    ORDER BY updated_at;
  `, {
    model: PatientAdditionalData,
    type: QueryTypes.SELECT,
    mapToModel: true,
    replacements: { patientId },
  });

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
  canonicalRecord.canonical = true;

  // delete the ones we can 
  const toDelete = checkedRecords.filter(record => !record.canonical && !record.hasData);
  log.info(`Merging ${toDelete.length} records`, { patientId, canonicalId: canonicalRecord.record.id });
  for (const checkedRecord of toDelete) {
    await PatientAdditionalData.update({
      mergedIntoId: canonicalRecord.record.id,
      deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
      updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
      title: 'test',
    }, {
      where: {
        id: checkedRecord.record.id,
      }
    });
  }

  // warn if there are any OTHER records with data, which will need to be resolved manually
  // TODO: more intelligent merge logic
  const unmergeable = checkedRecords.filter(record => !record.canonical && record.hasData);
  if (unmergeable.length > 0) {
    log.warn(`Patient ${patientId} has ${unmergeable.length} unmergeable PatientAdditionalData records`);
  }

  // return some tallies for reporting
  return {
    unmergeable: unmergeable.length,
    deleted: toDelete.length,
  };
}

export async function removeDuplicatedPatientAdditionalData(sequelize) {
  
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

  const patientIdsCount = patientIdsCountData[0].count;
  const batchSize = 1000;
  const batchCount = Math.ceil(patientIdsCount / batchSize);

  log.info(`Found ${patientIdsCount} total patients with >1 additional data record`, { batchCount });

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
    const [patients] = await sequelize.query(`
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
    `, {
      replacements: {
        cursor,
        batchSize,
      }
    });

    log.info(`Starting a batch of ${patients.length} patients`, { startId: patients[0].patient_id });
    for (const patient of patients) {
      const patientId = patient.patient_id;
      try {
        const { deleted, unmergeable } = await reconcilePatient(sequelize, patientId);
        tallies.deleted += deleted;
        tallies.unmergeable += unmergeable;
      } catch(e) {
        log.error('Error encountered when reconciling data', { patientId, error: e });
        tallies.errors += 1;
      }
      tallies.patients += 1;

      // update the cursor so we don't get stuck on errors or unmergeable records
      cursor = patientId;
    }
  }

  return tallies;
};

async function runRemoverCommand() {
  const store = await initDatabase({ testMode: false });
  const tallies = await removeDuplicatedPatientAdditionalData(store.sequelize);
  log.info('Finished merging records.', tallies);
  process.exit(0);
}

export const removeDuplicatedPatientAdditionalDataCommand = new Command(
  'removeDuplicatedPatientAdditionalData',
)
  .description('Remove duplicated PatientAdditionalData records (intended to fix a specific bug)')
  .action(runRemoverCommand);
