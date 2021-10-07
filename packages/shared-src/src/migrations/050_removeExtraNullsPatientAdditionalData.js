import { arrayToDbString } from '../utils';

const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    const patientIdsCountData = await query.sequelize.query(`
        SELECT COUNT(*)
        FROM (SELECT patient_id
        FROM patient_additional_data
        GROUP BY patient_id
        HAVING COUNT(patient_id) > 1) patientIds;
    `);

    const patientAdditionalDataColumns = [
      'place_of_birth',
      'primary_contact_number',
      'secondary_contact_number',
      'marital_status',
      'city_town',
      'street_village',
      'educational_level',
      'social_media',
      'blood_type',
      'title',
      'ethnicity_id',
      'nationality_id',
      'country_id',
      'division_id',
      'subdivision_id',
      'medical_area_id',
      'nursing_zone_id',
      'settlement_id',
      'occupation_id',
      'birth_certificate',
      'driving_license',
      'passport',
      'religion_id',
      'parent_billing_type_id',
      'country_of_birth_id',
      'registered_by_id',
    ];

    const patientIdsCount = patientIdsCountData[0][0].count;
    const batchSize = 1000;
    const batchCount = Math.ceil(patientIdsCount / batchSize);

    // Run in batches to avoid OOM issue
    for (let i = 0; i < batchCount; i++) {
      const patients = await query.sequelize.query(`
        SELECT existing_patient_additional_data.patient_id
        FROM (SELECT patient_id
          FROM patient_additional_data
          WHERE deleted_at IS NULL) AS existing_patient_additional_data
        GROUP BY existing_patient_additional_data.patient_id
        HAVING COUNT(existing_patient_additional_data.patient_id) > 1
        LIMIT ${batchSize};
    `);

      for (const patient of patients[0]) {
        const patientId = patient.patient_id;
        const [patientAdditionalDataRecords] = await query.sequelize.query(`
            SELECT *
            FROM patient_additional_data
            WHERE patient_id = '${patientId}'
            ORDER BY updated_at;
        `);

        const toDelete = [];
        for (const patientAdditionalData of patientAdditionalDataRecords) {
          // check if this is a null PatientAdditionalData
          const hasData = patientAdditionalDataColumns.some(
            col => patientAdditionalData[col] !== null && patientAdditionalData[col] !== undefined,
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
          await query.sequelize.query(
            `
              UPDATE patient_additional_data
              SET deleted_at = CURRENT_TIMESTAMP(3)
              WHERE id IN (${arrayToDbString(toDelete)});
            `,
            {
              type: Sequelize.QueryTypes.UPDATE,
            },
          );
        }
      }
    }

    console.log('Finished removing extra nulls PatientAdditionalData');
  },

  down: async query => {
    // Not possible to revert
  },
};
