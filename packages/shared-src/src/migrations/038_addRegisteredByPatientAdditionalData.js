const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_additional_data', 'registered_by', {
      type: sequelize.STRING,
    });
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'registered_by');
  },
};
