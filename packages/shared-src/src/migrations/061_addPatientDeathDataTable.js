const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('patient_death_data', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      patient_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patients',
          key: 'id',
        },
        allowNull: false,
      },
      clinician_id: {
        type: Sequelize.STRING,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: false,
      },
      facility_id: {
        type: Sequelize.STRING,
        references: {
          model: 'facilities',
          key: 'id',
        },
        allowNull: true,
      },

      manner: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      recent_surgery: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_surgery_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_surgery_reason_id: {
        type: Sequelize.STRING,
        references: {
          model: 'reference_data',
          key: 'id',
        },
        allowNull: true,
      },

      external_cause_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      external_cause_location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      external_cause_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      was_pregnant: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pregnancy_contributed: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      fetal_or_infant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      stillborn: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      birth_weight: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: true,
      },
      within_day_of_birth: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      hours_survived_since_birth: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: true,
      },
      carrier_age: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: true,
      },
      carrier_pregnancy_weeks: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: true,
      },
      carrier_existing_condition_id: {
        type: Sequelize.STRING,
        references: {
          model: 'reference_data',
          key: 'id',
        },
        allowNull: true,
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
    await query.dropTable('patient_death_data');
  },
};
