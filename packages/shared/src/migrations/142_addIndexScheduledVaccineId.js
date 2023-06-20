module.exports = {
  up: async query => {
    await query.addIndex('administered_vaccines', ['scheduled_vaccine_id']);
  },
  down: async query => {
    await query.removeIndex('administered_vaccines', ['scheduled_vaccine_id']);
  },
};
