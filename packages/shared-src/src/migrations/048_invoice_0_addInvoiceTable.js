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
      total: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receipt_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      date: {
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
