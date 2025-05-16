import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('patient_program_registration_conditions', 'condition_category', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unknown',
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('patient_program_registration_conditions', 'condition_category');
}
