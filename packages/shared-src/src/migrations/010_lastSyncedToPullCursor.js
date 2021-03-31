const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('sync_metadata', 'pull_cursor', Sequelize.STRING);
    await query.removeColumn('sync_metadata', 'last_synced');
  },

  down: async query => {
    await query.addColumn('sync_metadata', 'last_synced');
    await query.removeColumn('sync_metadata', 'pull_cursor', {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    });
  },
};
