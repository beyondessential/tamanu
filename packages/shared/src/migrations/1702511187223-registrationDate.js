import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_program_registrations', 'registration_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}

export async function down(query) {
  await query.removeColumn('patient_program_registrations', 'registration_date');
}
