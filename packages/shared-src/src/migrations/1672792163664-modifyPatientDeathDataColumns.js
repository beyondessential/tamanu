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
  await query.addColumn('patient_death_data', 'is_final', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.sequelize.query(`
    UPDATE patient_death_data
    SET is_final = TRUE;
  `);
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
  await query.removeColumn('patient_death_data', 'is_final');
}
