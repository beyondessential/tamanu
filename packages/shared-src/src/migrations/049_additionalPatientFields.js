const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_additional_data', 'emergency_contact_name', {
      type: Sequelize.STRING,
      defaultValue: '',
    });
    await query.addColumn('patient_additional_data', 'emergency_contact_number', {
      type: Sequelize.STRING,
      defaultValue: '',
    });
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'emergency_contact_name');
    await query.removeColumn('patient_additional_data', 'emergency_contact_number');
  },
};
