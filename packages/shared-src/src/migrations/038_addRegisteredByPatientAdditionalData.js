const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_additional_data', 'registered_by_id', {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
    });
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'registered_by_id');
  },
};
