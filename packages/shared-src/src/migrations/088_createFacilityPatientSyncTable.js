import Sequelize from 'sequelize';

module.exports = {
  up: async query => {
    await query.createTable(
      'patient_facilities',
      {
        id: {
          type: Sequelize.STRING,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
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
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
        patient_id: {
          type: Sequelize.STRING,
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
    query.dropTable('patient_facilities');
  },
};
