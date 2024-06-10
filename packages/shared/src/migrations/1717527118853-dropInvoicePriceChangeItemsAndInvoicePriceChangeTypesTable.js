const Sequelize = require('sequelize');
const { INVOICE_LINE_ITEM_STATUSES } = require('@tamanu/constants');

module.exports = {
  up: async query => {
    await query.dropTable('invoice_price_change_items');
    await query.dropTable('invoice_price_change_types');
  },
  down: async query => {
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

    await query.createTable('invoice_price_change_items', {
      id: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      invoice_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id',
        },
      },
      invoice_price_change_type_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'invoice_price_change_types',
          key: 'id',
        },
      },
      ordered_by_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      percentage_change: {
        type: Sequelize.DECIMAL,
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
      status: {
        type: Sequelize.STRING,
        defaultValue: INVOICE_LINE_ITEM_STATUSES.ACTIVE,
        allowNull: false,
      },
    });
  },
};
