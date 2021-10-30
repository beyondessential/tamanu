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
      display_id: {
        type: Sequelize.STRING,
        allowNull: false,
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
      discount: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      orderedBy: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
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
    await query.dropTable('invoice_line_items');
  },
};
