const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.removeColumn('imaging_requests', 'note');
  },

  down: async query => {
    await query.addColumn('imaging_requests', 'note', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
