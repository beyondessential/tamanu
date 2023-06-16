const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('invoice_line_items', {
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
      invoice_line_type_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'invoice_line_types',
          key: 'id',
        },
      },
      date_generated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      percentage_change: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      ordered_by_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
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
    await query.dropTable('invoice_line_items');
  },
};
