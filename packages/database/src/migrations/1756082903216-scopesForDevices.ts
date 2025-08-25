import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('devices', 'scopes', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('devices', 'scopes');
}
