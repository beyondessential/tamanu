const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('invoices', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      display_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      encounter_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'encounters',
          key: 'id',
        },
      },
      facility_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'facilities',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'UNPAID',
      },
      total: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      marked_for_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await query.dropTable('invoices');
  },
};
