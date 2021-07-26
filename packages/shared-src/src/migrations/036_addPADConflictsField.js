const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // missing columns to add
    await query.addColumn('patient_additional_data', 'conflicts', {
      type: Sequelize.TEXT,
      default: '',
    });
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'conflicts');
  },
};
