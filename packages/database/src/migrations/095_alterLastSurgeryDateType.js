import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('patient_death_data', 'last_surgery_date', {
    type: DataTypes.DATESTRING,
  });
}

export async function down(query) {
  await query.changeColumn('patient_death_data', 'last_surgery_date', {
    type: DataTypes.DATETIMESTRING,
  });
}
