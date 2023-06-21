const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_additional_data', 'country_of_birth_id', {
      type: sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'country_of_birth');
  },
};
