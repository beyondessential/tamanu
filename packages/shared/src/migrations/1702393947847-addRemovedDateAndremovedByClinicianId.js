import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_program_registrations', 'removed_by_clinician_id', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await query.addColumn('patient_program_registrations', 'removed_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('patient_program_registrations', 'removed_by_clinician_id');
  await query.removeColumn('patient_program_registrations', 'removed_date');
}
