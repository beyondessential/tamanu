import { DataTypes, QueryInterface } from 'sequelize';

// DDL only: schema changes for sync_lookup self-healing (spec: specs/sync/lookup-table.md).
// No backfill — existing rows default to needs_rebuild = false.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('sync_lookup', 'needs_rebuild', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Stub rows created while flagging a record for rebuild have no data yet.
  await query.changeColumn('sync_lookup', 'data', {
    type: DataTypes.JSON,
    allowNull: true,
  });

  // Partial index so the self-heal pass can find flagged rows without scanning the whole table.
  await query.sequelize.query(`
    CREATE INDEX sync_lookup_needs_rebuild_index ON sync_lookup (record_type) WHERE needs_rebuild;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS sync_lookup_needs_rebuild_index;
  `);

  // DESTRUCTIVE: any existing NULL data (unhealed stub rows) cannot be restored to NOT NULL and
  // must be healed or removed before reverting.
  await query.changeColumn('sync_lookup', 'data', {
    type: DataTypes.JSON,
    allowNull: false,
  });

  await query.removeColumn('sync_lookup', 'needs_rebuild');
}
