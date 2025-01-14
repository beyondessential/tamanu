const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('imaging_requests', 'urgent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
  down: async (query) => {
    await query.removeColumn('imaging_requests', 'urgent');
  },
};
