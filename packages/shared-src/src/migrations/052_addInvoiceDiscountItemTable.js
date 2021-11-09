const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.createTable('invoice_discount_items', {
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
      invoice_discount_type_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'invoice_discount_types',
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
      discount: {
        type: Sequelize.DECIMAL,
        allowNull: true,
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
    await query.dropTable('invoice_discount_items');
  },
};
