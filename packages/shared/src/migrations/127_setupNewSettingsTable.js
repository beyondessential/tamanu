import Sequelize from 'sequelize';

const COMMON_COLUMNS = {
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

module.exports = {
  up: async query => {
    await query.dropTable('settings');
    await query.createTable('settings', {
      ...COMMON_COLUMNS,
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      facility_id: {
        type: Sequelize.STRING,
        references: {
          model: 'facilities',
          key: 'id',
        },
        allowNull: true,
      },
    });
  },
  down: async query => {
    await query.dropTable('settings');
    await query.createTable('settings', {
      ...COMMON_COLUMNS,
      settingName: {
        type: Sequelize.STRING,
        unique: true,
      },
      settingContent: Sequelize.STRING,
    });
  },
};
