const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('patient_vrs_data', {
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

      id_type: Sequelize.STRING,
      identifier: Sequelize.STRING,
      unmatched_village_name: Sequelize.STRING,
      patient_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patients',
          key: 'id',
        },
      },
    });
  },
  down: async query => {
    await query.dropTable('patient_vrs_data');
  },
};
