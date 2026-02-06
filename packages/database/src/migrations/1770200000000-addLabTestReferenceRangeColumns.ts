import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_tests', 'reference_range_min', {
    type: DataTypes.DOUBLE,
    allowNull: true,
  });
  await query.addColumn('lab_tests', 'reference_range_max', {
    type: DataTypes.DOUBLE,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_tests', 'reference_range_min');
  await query.removeColumn('lab_tests', 'reference_range_max');
}
