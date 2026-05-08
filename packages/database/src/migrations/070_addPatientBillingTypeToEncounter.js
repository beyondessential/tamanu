const sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('encounters', 'patient_billing_type_id', {
      type: sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });
  },
  down: async (query) => {
    await query.removeColumn('encounters', 'patient_billing_type_id');
  },
};
