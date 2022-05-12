const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_additional_data', 'merged_into_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'patient_additional_data', key: 'id' },
    });
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'merged_into_id');
  },
};
