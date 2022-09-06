import Sequelize from 'sequelize';

module.exports = {
  up: async query => {
    await query.createTable(
      'patient_facilities',
      {
        // for patient_facilities, we use a composite primary key of patient_id plus facility_id,
        // so that if two users on different devices mark the same patient for sync, the join
        // record is treated as the same record, making the sync merge strategy trivial
        // id is still produced, but just as a deterministically generated convenience column for
        // consistency and to maintain the assumption of "id" existing in various places
        id: {
          type: `TEXT GENERATED ALWAYS AS ("patient_id" || '-' || "facility_id") STORED`,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        deleted_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at_sync_index: {
          type: Sequelize.BIGINT,
        },
        facility_id: {
          type: Sequelize.STRING,
          primaryKey: true, // composite primary key
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
        patient_id: {
          type: Sequelize.STRING,
          primaryKey: true, // composite primary key
          references: {
            model: 'patients',
            key: 'id',
          },
        },
      },
      {
        uniqueKeys: {
          patient_facility_unique: {
            fields: ['patient_id', 'facility_id'],
          },
        },
      },
    );

    await query.sequelize.query(`
      CREATE TRIGGER set_patient_facilities_updated_at_sync_index_on_insert
      BEFORE INSERT ON patient_facilities
      FOR EACH ROW
      WHEN (NEW.updated_at_sync_index IS NULL) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_at_sync_index();
    `);
    await query.sequelize.query(`
      CREATE TRIGGER set_patient_facilities_updated_at_sync_index_on_update
      BEFORE UPDATE ON patient_facilities
      FOR EACH ROW
      WHEN (NEW.updated_at_sync_index IS NULL OR NEW.updated_at_sync_index = OLD.updated_at_sync_index) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_at_sync_index();
    `);
  },
  down: async query => {
    await query.dropTable('patient_facilities');
  },
};
