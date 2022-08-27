import config from 'config';
import Sequelize from 'sequelize';

module.exports = {
  up: async query => {
    // // thanks Félix for this uuid generator, copied from migration 81
    // const uuidgen = `uuid_in(overlay(overlay(md5(random()::text || ':' || random()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring)`;
    // await query.sequelize.query(`
    //   INSERT INTO patient_facilities (id, patient_id, facility_id, created_at, updated_at)
    //   SELECT ${uuidgen}, patients.id, '${config.serverFacilityId}', now(), now()
    //   FROM patients
    //   WHERE patients.marked_for_sync = TRUE;
    // `);
    // await query.removeColumn('patients', 'marked_for_sync');
  },
  down: async query => {
    await query.addColumn('patients', 'marked_for_sync', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await query.sequelize.query(`
      UPDATE patients
      SET marked_for_sync = TRUE
      FROM (
        SELECT patient_id
        FROM patient_facilities
        WHERE facility_id = '${config.serverFacilityId}'
      ) AS marked_for_sync_patients
      WHERE patients.id = marked_for_sync_patients.patient_id;
    `);
    await query.sequelize.query(`
      TRUNCATE TABLE patient_facilities;
    `);
  },
};
