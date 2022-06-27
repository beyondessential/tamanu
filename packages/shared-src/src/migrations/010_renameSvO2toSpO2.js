module.exports = {
  up: async query => {
    await query.renameColumn('vitals', 'svo2', 'spo2');
  },
  down: async query => {
    await query.renameColumn('vitals', 'spo2', 'svo2');
  },
};
