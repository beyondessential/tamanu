module.exports = {
  up: async query => {
    await query.renameColumn('appointments', 'startTime', 'start_time');
    await query.renameColumn('appointments', 'endTime', 'end_time');
  },
  down: async query => {
    await query.renameColumn('appointments', 'start_time', 'startTime');
    await query.renameColumn('appointments', 'end_time', 'endTime');
  },
};
