import config from 'config';
import Sequelize from 'sequelize';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

export default {
  up: async (query) => {
    const serverFacilityIds = selectFacilityIds(config);
    if (serverFacilityIds) {
      await Promise.all(
        serverFacilityIds.map(async (facilityId) => {
          await query.sequelize.query(
            `
          INSERT INTO patient_facilities (patient_id, facility_id, created_at, updated_at, updated_at_sync_tick)
          SELECT patients.id, '${facilityId}', now(), now(), 0 -- updated_at_sync_tick of 0 will be included in first push
          FROM patients
          WHERE patients.marked_for_sync IS TRUE;
        `,
          );
        }),
      );
    }
    await query.removeColumn('patients', 'marked_for_sync');
  },
  down: async (query) => {
    await query.addColumn('patients', 'marked_for_sync', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    const serverFacilityIds = selectFacilityIds(config);
    if (serverFacilityIds) {
      await query.sequelize.query(`
        UPDATE patients
        SET marked_for_sync = TRUE
        FROM (
          SELECT patient_id
          FROM patient_facilities
          WHERE facility_id IN ('${serverFacilityIds.join("','")}')
        ) AS marked_for_sync_patients
        WHERE patients.id = marked_for_sync_patients.patient_id;
      `);
    }
    await query.sequelize.query(`
      TRUNCATE TABLE patient_facilities;
    `);
  },
};
