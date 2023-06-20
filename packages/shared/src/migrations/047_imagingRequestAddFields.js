const Sequelize = require('sequelize');

const IMAGING_REQUEST_STATUS_TYPES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);

module.exports = {
  up: async query => {
    await query.addColumn('imaging_requests', 'results', {
      type: Sequelize.STRING,
      defaultValue: '',
    });
    await query.changeColumn('imaging_requests', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
    });
  },
  down: async query => {
    await query.removeColumn('imaging_requests', 'results');
    await query.changeColumn('imaging_requests', 'status', {
      type: Sequelize.ENUM(ALL_IMAGING_REQUEST_STATUS_TYPES),
    });
  },
};
