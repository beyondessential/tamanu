const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('report_requests', 'process_started_time', {
      type: Sequelize.DATE,
    });
  },

  down: async query => {
    await query.removeColumn('report_requests', 'process_started_time');
  },
};
