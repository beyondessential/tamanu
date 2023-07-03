const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.renameColumn('patient_death_data', 'secondary_cause_id', 'antecedent_cause1_id');
    await query.addColumn('patient_death_data', 'antecedent_cause2_id', {
      type: Sequelize.STRING,
      references: {
        model: 'death_causes',
        key: 'id',
      },
      allowNull: true,
    });
  },
  down: async query => {
    await query.renameColumn('patient_death_data', 'antecedent_cause1_id', 'secondary_cause_id');
    await query.removeColumn('patient_death_data', 'antecedent_cause2_id');
  },
};
