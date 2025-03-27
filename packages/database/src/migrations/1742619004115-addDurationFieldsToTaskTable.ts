import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('tasks', 'duration_value', {
    type: DataTypes.DECIMAL,
    allowNull: true,
  });
  await query.addColumn('tasks', 'duration_unit', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('tasks', 'duration_value');
  await query.removeColumn('tasks', 'duration_unit');
}
