import Sequelize from 'sequelize';

export async function up(query) {
  await query.changeColumn('patient_birth_data', 'gestational_age_estimate', {
    type: Sequelize.FLOAT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.changeColumn('patient_birth_data', 'gestational_age_estimate', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
}
