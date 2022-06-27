const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('encounter_medications', 'repeats', {
      type: Sequelize.INTEGER,
    });
    await query.addColumn('encounter_medications', 'is_discharge', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async query => {
    await query.removeColumn('encounter_medications', 'repeats');
    await query.removeColumn('encounter_medications', 'is_discharge');
  },
};
