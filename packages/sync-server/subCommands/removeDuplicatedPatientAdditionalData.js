import Sequelize from 'sequelize';
import { log } from 'shared/services/logging';
import { arrayToDbString } from 'shared/utils';

export const removeDuplicatedPatientAdditionalData = async (store, options) => {
  const [patientIdsCountData] = await store.sequelize.query(`
        SELECT COUNT(*)
        FROM (SELECT patient_id
        FROM patient_additional_data
        GROUP BY patient_id
        HAVING COUNT(patient_id) > 1) patientIds;
    `);

  const METADATA_COLUMNS = [
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
    'patient_id',
    'marked_for_push',
    'pushed_at',
    'pulled_at',
  ];

  const patientIdsCount = patientIdsCountData[0].count;
  const batchSize = 1000;
  const batchCount = Math.ceil(patientIdsCount / batchSize);

  // Run in batches to avoid OOM issue
  for (let i = 0; i < batchCount; i++) {
    const [patients] = await store.sequelize.query(`
        SELECT existing_patient_additional_data.patient_id
        FROM (SELECT patient_id
          FROM patient_additional_data
          WHERE deleted_at IS NULL) AS existing_patient_additional_data
        GROUP BY existing_patient_additional_data.patient_id
        HAVING COUNT(existing_patient_additional_data.patient_id) > 1
        LIMIT ${batchSize};
    `);

    for (const patient of patients) {
      const patientId = patient.patient_id;
      const [patientAdditionalDataRecords] = await store.sequelize.query(`
            SELECT *
            FROM patient_additional_data
            WHERE patient_id = '${patientId}'
            ORDER BY updated_at;
        `);

      const toDelete = [];
      for (const patientAdditionalData of patientAdditionalDataRecords) {
        // check if this is a null PatientAdditionalData
        const hasData = Object.keys(patientAdditionalData).some(
          col =>
            !METADATA_COLUMNS.includes(col) &&
            patientAdditionalData[col] !== null &&
            patientAdditionalData[col] !== undefined,
        );

        const isLastPatientAdditionalDataRecord =
          patientAdditionalDataRecords.length - toDelete.length === 1;

        // if the record is null, but it is the only one left,
        // don't delete it because we always expect one PatientAdditionalData for a Patient
        if (!hasData && !isLastPatientAdditionalDataRecord) {
          toDelete.push(patientAdditionalData.id);
        }
      }

      if (toDelete.length) {
        log.info('Deleting duplicated PatientAdditionalData with ids: ', toDelete);
        await store.sequelize.query(
          `
              UPDATE patient_additional_data
              SET deleted_at = CURRENT_TIMESTAMP(3),
              updated_at = CURRENT_TIMESTAMP(3)
              WHERE id IN (${arrayToDbString(toDelete)});
            `,
          {
            type: Sequelize.QueryTypes.UPDATE,
          },
        );
      }
    }
  }

  log.info('Finished removing extra nulls PatientAdditionalData');

  process.exit(0);
};
