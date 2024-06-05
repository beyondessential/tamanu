
module.exports = {
  up: async query => {
    await query.dropTable('invoice_price_change_types');
  },
};
