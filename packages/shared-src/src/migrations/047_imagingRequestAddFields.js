const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('imaging_requests', 'results', {
      type: Sequelize.STRING,
      defaultValue: '',
    });
    await query.changeColumn('imaging_requests', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending'
    });
  },
  down: async query => {
    await query.removeColumn('imaging_requests', 'results');
    await query.changeColumn('imaging_requests', 'status', {
      type: Sequelize.ENUM(NOTE_TYPES),
    });
  },
};
