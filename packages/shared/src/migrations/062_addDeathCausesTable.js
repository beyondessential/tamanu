const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('death_causes', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      time_after_onset: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: false,
      },

      patient_death_data_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patient_death_data',
          key: 'id',
        },
        allowNull: false,
      },
      condition_id: {
        type: Sequelize.STRING,
        references: {
          model: 'reference_data',
          key: 'id',
        },
        allowNull: false,
      },

      marked_for_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_pushing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pushed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pulled_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
    });
  },
  down: async query => {
    await query.dropTable('death_causes');
  },
};
