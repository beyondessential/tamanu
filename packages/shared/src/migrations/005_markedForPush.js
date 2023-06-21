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
      await query.addColumn(table, 'marked_for_push', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },
  down: async query => {
    for (const table of tables) {
      await query.removeColumn(table, 'marked_for_push');
    }
  },
};
