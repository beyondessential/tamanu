import Sequelize from 'sequelize';

module.exports = {
  up: async query => {
    await query.createTable(
      'patient_facilities',
      {
        // For patient_facilities, we use a composite primary key of patient_id plus facility_id,
        // so that if two users on different devices mark the same patient for sync, the join
        // record is treated as the same record, making the sync merge strategy trivial
        // id is still produced, but just as a deterministically generated convenience column for
        // consistency and to maintain the assumption of "id" existing in various places
        // N.B. because ':' is used to join the two, we replace any actual occurrence of ':' with ';'
        // to avoid clashes on the joined id
        id: {
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
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
  },
  down: async query => {
    await query.dropTable('patient_facilities');
  },
};
