const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('imaging_request', 'note', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async query => {
    await query.removeColumn('imaging_request', 'note');
  },
};
