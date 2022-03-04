const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_vrs_data', 'is_deleted_by_remote', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },
  down: async query => {
    await query.removeColumn('patient_vrs_data', 'is_deleted_by_remote');
  },
};
