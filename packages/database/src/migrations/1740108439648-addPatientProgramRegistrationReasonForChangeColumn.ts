import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('patient_program_registration_conditions', 'reason_for_change', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('patient_program_registration_conditions', 'reason_for_change');
}
