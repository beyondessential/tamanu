const Sequelize = require('sequelize');
const {
  INVOICE_LINE_ITEM_STATUSES,
  INVOICE_PRICE_CHANGE_ITEM_STATUSES,
} = require('@tamanu/shared/constants');

module.exports = {
  up: async query => {
    await query.addColumn('invoice_line_items', 'status', {
      type: Sequelize.STRING,
      defaultValue: INVOICE_LINE_ITEM_STATUSES.ACTIVE,
      allowNull: false,
    });
    await query.addColumn('invoice_price_change_items', 'status', {
      type: Sequelize.STRING,
      defaultValue: INVOICE_PRICE_CHANGE_ITEM_STATUSES.ACTIVE,
      allowNull: false,
    });
  },
  down: async query => {
    await query.removeColumn('invoice_line_items', 'status');
    await query.removeColumn('invoice_price_change_items', 'status');
  },
};
