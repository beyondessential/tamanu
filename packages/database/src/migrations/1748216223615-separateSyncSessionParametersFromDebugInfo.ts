import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'parameters', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: '{}',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('sync_sessions', 'parameters');
}
