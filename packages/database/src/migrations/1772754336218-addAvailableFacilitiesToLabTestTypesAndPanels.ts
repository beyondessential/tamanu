import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_test_types', 'available_facilities', {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  });

  await query.addColumn('lab_test_panels', 'available_facilities', {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_test_types', 'available_facilities');
  await query.removeColumn('lab_test_panels', 'available_facilities');
}
