import { QueryInterface } from 'sequelize';
import {
  AUDIT_USERID_KEY,
  FACT_DEVICE_ID,
  FACT_CURRENT_VERSION,
  AUDIT_MIGRATION_CONTEXT_KEY,
  AUDIT_REASON_KEY,
  AUDIT_PAUSE_KEY,
} from '@tamanu/constants';

/**
 * Changelog rows are always written for tables using logs.record_change(),
 * except when audit is explicitly paused (tests, migrations).
 * The global setting audit.changes.enabled no longer gates inserts.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION logs.record_change()
    RETURNS trigger AS $$
    BEGIN
      IF get_session_config('${AUDIT_PAUSE_KEY}', 'false')::boolean THEN
        RETURN NEW;
      END IF;

      INSERT INTO logs.changes (
        table_oid,
        table_schema,
        table_name,
        updated_by_user_id,
        record_id,
        device_id,
        version,
        reason,
        migration_context,
        record_created_at,
        record_updated_at,
        record_deleted_at,
        record_data
      ) VALUES (
        TG_RELID,
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text),
        NEW.id,
        local_system_fact('${FACT_DEVICE_ID}', 'unknown'),
        local_system_fact('${FACT_CURRENT_VERSION}', 'unknown'),
        get_session_config('${AUDIT_REASON_KEY}', NULL),
        get_session_config('${AUDIT_MIGRATION_CONTEXT_KEY}', NULL),
        NEW.created_at,
        NEW.updated_at,
        NEW.deleted_at,
        to_jsonb(NEW.*)
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
      IF NOT logs.is_audit_changes_enabled() THEN
        RETURN NEW;
      END IF;

      INSERT INTO logs.changes (
        table_oid,
        table_schema,
        table_name,
        updated_by_user_id,
        record_id,
        device_id,
        version,
        reason,
        migration_context,
        record_created_at,
        record_updated_at,
        record_deleted_at,
        record_data
      ) VALUES (
        TG_RELID,
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text),
        NEW.id,
        local_system_fact('${FACT_DEVICE_ID}', 'unknown'),
        local_system_fact('${FACT_CURRENT_VERSION}', 'unknown'),
        get_session_config('${AUDIT_REASON_KEY}', NULL),
        get_session_config('${AUDIT_MIGRATION_CONTEXT_KEY}', NULL),
        NEW.created_at,
        NEW.updated_at,
        NEW.deleted_at,
        to_jsonb(NEW.*)
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
}
