import { SYNC_TICK_FLAGS } from '@tamanu/database/sync';

const OLD_SYNC_TIME_KEY = 'currentSyncTime';
const NEW_SYNC_TICK_KEY = 'currentSyncTick';

// copied from migration 123 with updated key
export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at_sync_tick()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        -- If setting to "${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER}" representing "not marked as updated on this client", we actually use
        -- a different number, "${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE}", to represent that in the db, so that we can identify the
        -- difference between explicitly setting it to not marked as updated (when NEW contains ${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER}),
        -- and having other fields updated without the updated_at_sync_tick being altered (in which
        -- case NEW will contain ${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE}, easily distinguished from ${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER})
        IF NEW.updated_at_sync_tick = ${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER} THEN
          NEW.updated_at_sync_tick := ${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE};
        ELSE
          SELECT value FROM local_system_facts WHERE key = '${NEW_SYNC_TICK_KEY}' INTO NEW.updated_at_sync_tick;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at_sync_tick()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        -- If setting to "${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER}" representing "not marked as updated on this client", we actually use
        -- a different number, "${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE}", to represent that in the db, so that we can identify the
        -- difference between explicitly setting it to not marked as updated (when NEW contains ${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER}),
        -- and having other fields updated without the updated_at_sync_tick being altered (in which
        -- case NEW will contain ${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE}, easily distinguished from ${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER})
        IF NEW.updated_at_sync_tick = ${SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER} THEN
          NEW.updated_at_sync_tick := ${SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE};
        ELSE
          SELECT value FROM local_system_facts WHERE key = '${OLD_SYNC_TIME_KEY}' INTO NEW.updated_at_sync_tick;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}
