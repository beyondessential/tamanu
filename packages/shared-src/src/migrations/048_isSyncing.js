const Sequelize = require('sequelize');

const tables = [
  'encounters',
  'lab_request_logs',
  'patients',
  'patient_additional_data',
  'patient_allergies',
  'patient_care_plans',
  'patient_conditions',
  'patient_family_histories',
  'patient_issues',
  'report_requests',
  'user_facilities',
];

module.exports = {
  up: async query => {
    for (const table of tables) {
      await query.addColumn(table, 'is_pushing', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
  down: async query => {
    for (const table of tables) {
      await query.removeColumn(table, 'is_pushing');
    }
  },
};
