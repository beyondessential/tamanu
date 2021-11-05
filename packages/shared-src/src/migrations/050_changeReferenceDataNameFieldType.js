const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('reference_data', 'name', {
      type: Sequelize.TEXT,
    });
  },
  down: async query => {
    await query.changeColumn('reference_data', 'name', {
      type: Sequelize.STRING,
    });
  },
};
