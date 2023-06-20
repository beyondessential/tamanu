const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('report_requests', 'marked_for_push', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },
  down: async query => {
    await query.removeColumn('report_requests', 'marked_for_push');
  },
};
