const Sequelize = require('sequelize');

export default {
  up: async (query) => {
    await query.addColumn('patient_death_data', 'outside_health_facility', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
  },
  down: async (query) => {
    await query.removeColumn('patient_death_data', 'outside_health_facility');
  },
};
