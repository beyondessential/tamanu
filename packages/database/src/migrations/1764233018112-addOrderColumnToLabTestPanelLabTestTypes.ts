import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('lab_test_panel_lab_test_types', 'order', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('lab_test_panel_lab_test_types', 'order');
}
