const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('users', 'visibility_status', {
      type: Sequelize.STRING,
      defaultValue: 'current', 
    });
  },

  down: async query => {
    await query.removeColumn('users', 'visibility_status');
  },
};
