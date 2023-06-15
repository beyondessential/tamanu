const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('lab_requests', 'priority', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
  },

  down: async query => {
    await query.removeColumn('lab_requests', 'priority');
  },
};
