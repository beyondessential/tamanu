module.exports = {
  up: async query => {
    await query.sequelize.query("DELETE FROM reference_data WHERE type = 'facility'");
  },
  down: async () => {
    // No down migration
  },
};
