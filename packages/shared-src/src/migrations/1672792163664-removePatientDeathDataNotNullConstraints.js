import { Sequelize } from 'sequelize';

export async function up(query) {
  await query.changeColumn('patient_death_data', 'manner', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await query.changeColumn('patient_death_data', 'fetal_or_infant', {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  });
}

export async function down(query) {
  await query.changeColumn('patient_death_data', 'manner', {
    type: Sequelize.STRING,
    allowNull: false,
  });
  await query.changeColumn('patient_death_data', 'fetal_or_infant', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  });
}
