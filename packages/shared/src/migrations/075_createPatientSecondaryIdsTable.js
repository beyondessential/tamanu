const Sequelize = require('sequelize');

// Boilerplate columns for all models
const basics = {
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
};

// Boilerplate columns for models that need to be synced
const syncColumns = {
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
};

module.exports = {
  up: async query => {
    await query.createTable('patient_secondary_ids', {
      ...basics,
      ...syncColumns,
      value: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      visibility_status: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type_id: {
        type: Sequelize.STRING,
        references: {
          model: 'reference_data',
          key: 'id',
        },
        allowNull: false,
      },
      patient_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patients',
          key: 'id',
        },
        allowNull: false,
      },
    });
  },
  down: async query => {
    await query.dropTable('patient_secondary_ids');
  },
};
