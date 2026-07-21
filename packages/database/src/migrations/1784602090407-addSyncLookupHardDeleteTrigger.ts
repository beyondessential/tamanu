import { QueryInterface } from 'sequelize';

// Function backing the AFTER DELETE trigger installed on lookup-tracked tables (see
// migrationHooks postMigrationHooks). set_updated_at_sync_tick is BEFORE INSERT OR UPDATE, so it
// never sees a hard DELETE — without this, a hard-deleted source row would orphan its sync_lookup
// row. This deletes directly (not flag-and-defer) so a snapshot can never ship a phantom record,
// and it fires unconditionally so bulk deletes performed by a migration are cleaned up too.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE FUNCTION remove_from_sync_lookup_on_hard_delete()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        DELETE FROM sync_lookup WHERE record_type = TG_TABLE_NAME AND record_id = OLD.id;
        RETURN OLD;
      END
      $func$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: CASCADE also drops every per-table AFTER DELETE trigger installed against this
  // function (see addSyncLookupDeleteTrigger in postMigrationHooks) — a subsequent migration run
  // reinstalls them via the post-migration hook, but until then hard deletes on lookup-tracked
  // tables will orphan their sync_lookup row.
  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS remove_from_sync_lookup_on_hard_delete() CASCADE;
  `);
}
