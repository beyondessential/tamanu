const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // missing columns to add
    await query.addColumn('lab_requests', 'note', {
      type: Sequelize.STRING,
    });

    // extra columns to remove
    await query.removeColumn('encounters', 'type');
  },
  down: async query => {
    await query.removeColumn('lab_requests', 'note');

    await query.addColumn('encounters', 'type', {
      type: Sequelize.ENUM(['issue', 'warning']),
    });
  },
};
