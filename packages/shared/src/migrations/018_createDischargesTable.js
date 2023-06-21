const Sequelize = require('sequelize');

const dischargeFields = {
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
  note: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  encounter_id: {
    type: Sequelize.STRING,
    references: {
      model: 'encounters',
      key: 'id',
    },
    allowNull: false,
  },
  discharger_id: {
    type: Sequelize.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
  },
};

module.exports = {
  up: async query => {
    await query.createTable('discharges', dischargeFields);
  },
  down: async query => {
    await query.dropTable('discharges');
  },
};
