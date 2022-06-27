const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('patient_death_data', 'primary_cause_id', {
      type: Sequelize.STRING,
      references: {
        model: 'death_causes',
        key: 'id',
      },
      allowNull: true,
    });
    await query.addColumn('patient_death_data', 'secondary_cause_id', {
      type: Sequelize.STRING,
      references: {
        model: 'death_causes',
        key: 'id',
      },
      allowNull: true,
    });
  },
  down: async query => {
    await query.removeColumn('patient_death_data', 'primary_cause_id');
    await query.removeColumn('patient_death_data', 'secondary_cause_id');
  },
};
