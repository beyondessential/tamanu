const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_additional_data', 'pushed_at', Sequelize.DATE);
    await query.addColumn('patient_additional_data', 'pulled_at', Sequelize.DATE);
  },
  down: async query => {
    await query.removeColumn('patient_additional_data', 'pushed_at');
    await query.removeColumn('patient_additional_data', 'pulled_at');
  },
};
