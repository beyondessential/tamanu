import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_birth_data', 'birth_order', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_birth_data', 'birth_order');
}
