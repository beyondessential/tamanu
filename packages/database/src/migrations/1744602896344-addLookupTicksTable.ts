import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('sync_lookup_ticks', {
    id: {
      type: `BIGINT GENERATED ALWAYS AS (lookup_end_tick) STORED`,
    },
    source_start_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    lookup_end_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('sync_lookup_ticks');
}
