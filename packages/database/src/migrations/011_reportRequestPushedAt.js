const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('report_requests', 'pushed_at', Sequelize.DATE);
    await query.addColumn('report_requests', 'pulled_at', Sequelize.DATE);
  },
  down: async (query) => {
    await query.removeColumn('report_requests');
    await query.removeColumn('report_requests');
  },
};
