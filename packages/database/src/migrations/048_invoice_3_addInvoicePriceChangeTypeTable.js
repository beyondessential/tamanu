const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.createTable('invoice_price_change_types', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      item_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      item_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      percentage_change: {
        type: Sequelize.DECIMAL,
        allowNull: false,
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
  down: async (query) => {
    await query.dropTable('invoice_price_change_types');
  },
};
