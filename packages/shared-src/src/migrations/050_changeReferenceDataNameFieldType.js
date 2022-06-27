const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.changeColumn('reference_data', 'name', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
  down: async query => {
    await query.changeColumn('reference_data', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
