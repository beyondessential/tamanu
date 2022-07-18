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
        updated_since_session: {
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
      CREATE TRIGGER set_patient_facilities_updated_since_session_on_insert
      BEFORE INSERT ON patient_facilities
      FOR EACH ROW
      WHEN (NEW.updated_since_session IS NULL) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_since_session();
    `);
    await query.sequelize.query(`
      CREATE TRIGGER set_patient_facilities_updated_since_session_on_update
      BEFORE UPDATE ON patient_facilities
      FOR EACH ROW
      WHEN (NEW.updated_since_session IS NULL OR NEW.updated_since_session = OLD.updated_since_session) -- i.e. when an override value has not been passed in
      EXECUTE FUNCTION set_updated_since_session();
    `);
  },
  down: async query => {
    query.dropTable('patient_facilities');
  },
};
