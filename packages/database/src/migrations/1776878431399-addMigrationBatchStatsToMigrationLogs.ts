import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { schema: 'logs', tableName: 'migrations' };
const UPGRADE_RUN_INDEX = 'migration_logs_upgrade_run_id_idx';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'batch_duration_ms', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'upgrade_run_id', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'stats', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
  await query.addIndex(TABLE, ['upgrade_run_id'], {
    name: UPGRADE_RUN_INDEX,
    using: 'btree',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, UPGRADE_RUN_INDEX);
  await query.removeColumn(TABLE, 'stats');
  await query.removeColumn(TABLE, 'upgrade_run_id');
  await query.removeColumn(TABLE, 'batch_duration_ms');
}
