const sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('scheduled_vaccines', 'weeksFromLastVaccinationDue', {
      type: sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async query => {
    await query.removeColumn('scheduled_vaccines', 'weeksFromLastVaccinationDue');
  },
};
