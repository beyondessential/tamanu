import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_tests', 'reference_range_text', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: This will not restore reference range text override values.
  await query.removeColumn('lab_tests', 'reference_range_text');
}
