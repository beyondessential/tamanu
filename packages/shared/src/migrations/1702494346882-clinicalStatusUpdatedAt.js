import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_program_registrations', 'clinical_status_updated_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('patient_program_registrations', 'clinical_status_updated_at');
}
