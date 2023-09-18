const sequelize = require('sequelize');

const STRING_COLUMNS = ['birth_certificate', 'driving_license', 'passport'];
const REF_DATA_COLUMNS = ['religion_id', 'patient_billing_type_id'];

module.exports = {
  up: async query => {
    for (const col of STRING_COLUMNS) {
      await query.addColumn('patient_additional_data', col, sequelize.STRING);
    }
    for (const col of REF_DATA_COLUMNS) {
      await query.addColumn('patient_additional_data', col, {
        type: sequelize.STRING,
        references: {
          model: 'reference_data',
          key: 'id',
        },
      });
    }
  },
  down: async query => {
    for (const col of REF_DATA_COLUMNS) {
      await query.removeColumn('patient_additional_data', col);
    }
    for (const col of STRING_COLUMNS) {
      await query.removeColumn('patient_additional_data', col);
    }
  },
};
