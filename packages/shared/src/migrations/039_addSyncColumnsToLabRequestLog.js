const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('lab_request_logs', 'marked_for_push', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await query.addColumn('lab_request_logs', 'marked_for_sync', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await query.addColumn('lab_request_logs', 'pushed_at', Sequelize.DATE);
    await query.addColumn('lab_request_logs', 'pulled_at', Sequelize.DATE);
  },
  down: async query => {
    await query.removeColumn('lab_request_logs', 'marked_for_push');
    await query.removeColumn('lab_request_logs', 'marked_for_sync');
    await query.removeColumn('lab_request_logs', 'pushed_at');
    await query.removeColumn('lab_request_logs', 'pulled_at');
  },
};
