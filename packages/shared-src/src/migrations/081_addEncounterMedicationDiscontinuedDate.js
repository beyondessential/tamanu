const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('encounter_medications', 'discontinuedDate', {
      type: Sequelize.STRING,
    });
  },
  down: async query => {
    await query.removeColumn('encounter_medications', 'discontinuedDate');
  },
};
