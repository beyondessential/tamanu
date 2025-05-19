import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_sessions', 'min_source_tick', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
  await query.addColumn('sync_sessions', 'max_source_tick', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('sync_sessions', 'min_source_tick');
  await query.removeColumn('sync_sessions', 'max_source_tick');
}
