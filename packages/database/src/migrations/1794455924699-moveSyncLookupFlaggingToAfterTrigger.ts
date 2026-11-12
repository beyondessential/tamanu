import { QueryInterface } from 'sequelize';
import { log } from '@tamanu/shared/services/logging/log';
import { addOrReplaceSyncLookupDisabledFlagTrigger } from '../services/migrations/hooks/postMigrationHooks';

// Moves sync_lookup self-heal flagging out of the BEFORE trigger set_updated_at_sync_tick and into
// its own AFTER INSERT OR UPDATE trigger (installed per lookup-tracked table by the post-migration
// hook). A BEFORE ROW trigger sees NULL for stored generated columns, so tables whose `id` is
// generated (translated_strings, user_preferences, patient_facilities, ...) were flagged with a
// NULL record_id, failing any migration that wrote to them on central. By the AFTER trigger the
// generated `id` is populated. See specs/sync/lookup-table.md (LOOKUP).
//
// The per-table triggers are installed here as well as by the post-migration hook, because that
// hook only runs after the whole batch: without this, a later migration in the same batch that
// writes to a lookup-tracked table would not be flagged for rebuild.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE FUNCTION flag_sync_lookup_for_rebuild_when_sync_trigger_disabled()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        IF ((SELECT value FROM local_system_facts WHERE key = 'syncTrigger') = 'disabled') THEN
          PERFORM flag_for_rebuild_in_sync_lookup(TG_TABLE_NAME, NEW.id::text);
        END IF;
        RETURN NEW;
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

  await addOrReplaceSyncLookupDisabledFlagTrigger.run({ log, sequelize: query.sequelize });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: CASCADE also drops every per-table AFTER trigger installed against this function
  // (see addSyncLookupDisabledFlagTrigger in postMigrationHooks). The function restored below only
  // flags tables whose BEFORE trigger carries the lookup-tracked arg, which the post-migration hook
  // from before this migration installed.
  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS flag_sync_lookup_for_rebuild_when_sync_trigger_disabled() CASCADE;
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
}
