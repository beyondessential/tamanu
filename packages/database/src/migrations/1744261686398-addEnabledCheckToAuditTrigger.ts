import { QueryInterface } from 'sequelize';
import { AUDIT_USERID_KEY, AUDIT_PAUSE_KEY } from '@tamanu/constants/database';
import { SETTINGS_SCOPES } from '@tamanu/constants/settings';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION logs.is_audit_changes_enabled()
    RETURNS boolean AS $$
    BEGIN
      IF get_session_config('${AUDIT_PAUSE_KEY}', 'false')::boolean THEN
        RETURN false;
      END IF;

      RETURN COALESCE(
        (SELECT value::boolean
         FROM settings
         WHERE key = 'audit.changes.enabled'
         AND scope = '${SETTINGS_SCOPES.GLOBAL}'),
        false
      );
    END;
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION logs.record_change()
    RETURNS trigger AS $$
    BEGIN
      IF NOT logs.is_audit_changes_enabled() THEN
        RETURN NEW;
      END IF;

      INSERT INTO logs.changes (
        table_oid,
        table_schema,
        table_name,
        updated_by_user_id,
        record_id,
        record_update,
        record_created_at,
        record_updated_at,
        record_deleted_at,
        record_sync_tick,
        record_data
      ) VALUES (
        TG_RELID,                 -- table_oid
        TG_TABLE_SCHEMA,          -- table_schema
        TG_TABLE_NAME,            -- table_name
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
        NEW.id,                   -- record_id
        TG_OP = 'UPDATE',         -- record_update
        NEW.created_at,           -- created_at
        NEW.updated_at,           -- updated_at
        NEW.deleted_at,           -- deleted_at
        NEW.updated_at_sync_tick, -- updated_at_sync_tick
        to_jsonb(NEW.*)           -- record_data
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION logs.record_change()
    RETURNS trigger AS $$
    BEGIN
      IF (SELECT get_session_config('${AUDIT_PAUSE_KEY}', 'false')::boolean) THEN
        RETURN NEW;
      END IF;

      INSERT INTO logs.changes (
        table_oid,
        table_schema,
        table_name,
        updated_by_user_id,
        record_id,
        record_update,
        record_created_at,
        record_updated_at,
        record_deleted_at,
        record_sync_tick,
        record_data
      ) VALUES (
        TG_RELID,                 -- table_oid
        TG_TABLE_SCHEMA,          -- table_schema
        TG_TABLE_NAME,            -- table_name
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
        NEW.id,                   -- record_id
        TG_OP = 'UPDATE',         -- record_update
        NEW.created_at,           -- created_at
        NEW.updated_at,           -- updated_at
        NEW.deleted_at,           -- deleted_at
        NEW.updated_at_sync_tick, -- updated_at_sync_tick
        to_jsonb(NEW.*)           -- record_data
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await query.sequelize.query(`
    DROP FUNCTION logs.is_audit_changes_enabled();
  `);
}
