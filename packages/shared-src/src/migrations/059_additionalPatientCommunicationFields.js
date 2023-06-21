const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_communications', 'destination', {
      type: Sequelize.STRING,
      defaultValue: null,
    });
    await query.addColumn('patient_communications', 'attachment', {
      type: Sequelize.STRING,
      defaultValue: null,
    });
  },
  down: async query => {
    await query.removeColumn('patient_communications', 'destination');
    await query.removeColumn('patient_communications', 'attachment');
  },
};
