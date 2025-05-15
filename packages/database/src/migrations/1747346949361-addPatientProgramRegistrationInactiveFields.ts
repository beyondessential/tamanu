import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_program_registrations', 'deactivated_clinician_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  await query.addColumn('patient_program_registrations', 'deactivated_date', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_program_registrations', 'deactivated_clinician_id');
  await query.removeColumn('patient_program_registrations', 'deactivated_date');
}
