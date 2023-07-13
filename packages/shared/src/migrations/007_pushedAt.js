const Sequelize = require('sequelize');

const tables = [
  'encounters',
  'patients',
  'patient_allergies',
  'patient_care_plans',
  'patient_conditions',
  'patient_family_histories',
  'patient_issues',
];

module.exports = {
  up: async query => {
    for (const table of tables) {
      await query.addColumn(table, 'pushed_at', Sequelize.DATE);
      await query.addColumn(table, 'pulled_at', Sequelize.DATE);
    }
  },
  down: async query => {
    for (const table of tables) {
      await query.removeColumn(table, 'pushed_at', Sequelize.DATE);
      await query.removeColumn(table, 'pulled_at', Sequelize.DATE);
    }
  },
};
