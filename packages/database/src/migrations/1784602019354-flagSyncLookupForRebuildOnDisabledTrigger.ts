import { QueryInterface } from 'sequelize';

// Folds sync_lookup self-heal flagging into the existing sync tick trigger (Option B), rather than
// adding a separate always-firing trigger that would contend with the lookup table rebuild.
// See specs/sync/lookup-table.md (LOOKUP) and .workhorse/plans/p1/plan.md.
//
// TG_ARGV[0] (a literal baked in at trigger install time, see migrationHooks) tells the function
// per table whether that table feeds the lookup table (pull-from-central/bidirectional) and is
// running on central. Only then does the disabled-mode branch flag the lookup row for rebuild.
export async function up(query: QueryInterface): Promise<void> {
  // Standalone (not a trigger function) so it can be called with the flagged record's identity
  // directly. A fresh stub's is_deleted is a hard-coded placeholder — never read until the row is
  // healed (see specs/sync/lookup-table.md, LOOKUP) — since NEW isn't available outside a trigger.
  // Parameters are prefixed (p_...) because plpgsql raises "column reference is ambiguous" when a
  // parameter name matches a column of a table targeted by ON CONFLICT in the function body.
  await query.sequelize.query(`
    CREATE FUNCTION flag_for_rebuild_in_sync_lookup(p_record_type text, p_record_id text) RETURNS void
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        INSERT INTO sync_lookup (
          record_id,
          record_type,
          data,
          updated_at_sync_tick,
          is_lab_request,
          is_deleted,
          needs_rebuild
        )
        VALUES (
          p_record_id,
          p_record_type,
          NULL,
          0,
          false,
          false,
          true
        )
        ON CONFLICT (record_id, record_type)
        DO UPDATE SET needs_rebuild = true;
      END
      $func$;
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at_sync_tick()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      DECLARE
        current_tick bigint;
      BEGIN
        IF ((SELECT value FROM local_system_facts WHERE key = 'syncTrigger') = 'disabled') THEN
          IF (TG_NARGS > 0 AND TG_ARGV[0]::boolean) THEN
            PERFORM flag_for_rebuild_in_sync_lookup(TG_TABLE_NAME, NEW.id::text);
          END IF;
          RETURN NEW;
        END IF;
        -- If setting to "-1" representing "not marked as updated on this client", we actually use
        -- a different number, "-999", to represent that in the db, so that we can identify the
        -- difference between explicitly setting it to not marked as updated (when NEW contains -1),
        -- and having other fields updated without the updated_at_sync_tick being altered (in which
        -- case NEW will contain -999, easily distinguished from -1)
        IF NEW.updated_at_sync_tick = -1 THEN
          NEW.updated_at_sync_tick := -999;
        ELSE
          -- First get the current sync tick
          SELECT value FROM local_system_facts WHERE key = 'currentSyncTick' INTO current_tick;

          -- Then take an advisory lock on that sync tick value (if one doesn't already exist), to
          -- record that an active transaction is using this sync tick
          -- see waitForPendingEditsUsingSyncTick for more details
          PERFORM pg_try_advisory_xact_lock_shared(current_tick);

          -- Finally assign the locked sync tick to the record
          NEW.updated_at_sync_tick := current_tick;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at_sync_tick()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      DECLARE
        current_tick bigint;
      BEGIN
        IF ((SELECT value FROM local_system_facts WHERE key = 'syncTrigger') = 'disabled') THEN
            RETURN NEW;
        END IF;
        IF NEW.updated_at_sync_tick = -1 THEN
          NEW.updated_at_sync_tick := -999;
        ELSE
          SELECT value FROM local_system_facts WHERE key = 'currentSyncTick' INTO current_tick;
          PERFORM pg_try_advisory_xact_lock_shared(current_tick);
          NEW.updated_at_sync_tick := current_tick;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);

  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS flag_for_rebuild_in_sync_lookup(text, text);
  `);
}
