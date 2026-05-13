import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'wire_schema_version', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('sync_sessions', 'wire_schema_version');
}
