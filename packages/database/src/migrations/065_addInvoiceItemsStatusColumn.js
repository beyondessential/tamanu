const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('invoice_line_items', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'active',
      allowNull: false,
    });
    await query.addColumn('invoice_price_change_items', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'active',
      allowNull: false,
    });
  },
  down: async (query) => {
    await query.removeColumn('invoice_line_items', 'status');
    await query.removeColumn('invoice_price_change_items', 'status');
  },
};
