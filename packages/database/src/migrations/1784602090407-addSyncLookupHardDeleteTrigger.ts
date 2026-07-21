import { QueryInterface } from 'sequelize';

// Function backing the AFTER DELETE trigger installed on lookup-tracked tables (see
// migrationHooks postMigrationHooks). set_updated_at_sync_tick is BEFORE INSERT OR UPDATE, so it
// never sees a hard DELETE — without this, a hard-deleted source row would orphan its sync_lookup
// row. Flags rather than deleting directly: a direct delete would remove the row immediately,
// decoupled from when any *other* row referencing it gets rebuilt (e.g. record_a's FK switched
// from record_b to record_c, then record_b hard-deleted — a direct delete could remove record_b
// from sync_lookup before record_a's rebuild has caught up, so a snapshot taken in between would
// ship record_a still pointing at a record_b that's no longer there). Flagging instead means the
// removal happens via the next build's self-heal pass, in the same transaction as any dependent
// row's rebuild, so external snapshots only ever see both changes together, atomically.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE FUNCTION flag_sync_lookup_for_rebuild_on_hard_delete()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        PERFORM flag_for_rebuild_in_sync_lookup(TG_TABLE_NAME, OLD.id::text);
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
    DROP FUNCTION IF EXISTS flag_sync_lookup_for_rebuild_on_hard_delete() CASCADE;
  `);
}
