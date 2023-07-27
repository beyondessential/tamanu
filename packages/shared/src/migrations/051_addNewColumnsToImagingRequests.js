const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('imaging_requests', 'completed_by_id', {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
    });
    await query.addColumn('imaging_requests', 'location_id', {
      type: Sequelize.STRING,
      references: {
        model: 'locations',
        key: 'id',
      },
    });
  },
  down: async query => {
    await query.removeColumn('imaging_requests', 'completed_by_id');
    await query.removeColumn('imaging_requests', 'location_id');
  },
};
