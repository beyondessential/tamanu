const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('encounter_medications', 'discontinued', {
      type: Sequelize.BOOLEAN,
    });
    await query.addColumn('encounter_medications', 'discontinuing_clinician', {
      type: Sequelize.STRING,
    });
    await query.addColumn('encounter_medications', 'discontinuing_reason', {
      type: Sequelize.STRING,
    });
  },
  down: async query => {
    await query.removeColumn('encounter_medications', 'discontinued');
    await query.removeColumn('encounter_medications', 'discontinuing_clinician');
    await query.removeColumn('encounter_medications', 'discontinuing_reason');
  },
};
