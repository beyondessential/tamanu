const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('encounter_medications', 'discontinued_date', {
      type: Sequelize.STRING,
    });
  },
  down: async query => {
    await query.removeColumn('encounter_medications', 'discontinued_date');
  },
};
