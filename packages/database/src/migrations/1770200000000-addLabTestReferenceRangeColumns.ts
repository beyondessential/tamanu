import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_tests', 'reference_range_min', {
    type: DataTypes.FLOAT,
    allowNull: true,
  });
  await query.addColumn('lab_tests', 'reference_range_max', {
    type: DataTypes.FLOAT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_tests', 'reference_range_min');
  await query.removeColumn('lab_tests', 'reference_range_max');
}
