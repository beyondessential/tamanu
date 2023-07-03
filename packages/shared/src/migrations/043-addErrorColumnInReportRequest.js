const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('report_requests', 'error', {
      type: Sequelize.TEXT,
    });
  },

  down: async query => {
    await query.removeColumn('report_requests', 'error');
  },
};
