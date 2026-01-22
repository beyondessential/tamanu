import { DataTypes, QueryInterface } from 'sequelize';
import {
  AUDIT_USERID_KEY,
  FACT_DEVICE_ID,
  FACT_CURRENT_VERSION,
  AUDIT_MIGRATION_CONTEXT_KEY,
  AUDIT_REASON_KEY,
} from '@tamanu/constants';

const TABLE = {
  tableName: 'changes',
  schema: 'logs',
};

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'migration_context', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  
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
        TG_RELID,                 -- table_oid
        TG_TABLE_SCHEMA,          -- table_schema
        TG_TABLE_NAME,            -- table_name
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
        NEW.id,                   -- record_id
        local_system_fact('${FACT_DEVICE_ID}', 'unknown'), -- device_id,
        local_system_fact('${FACT_CURRENT_VERSION}', 'unknown'), -- version,
        get_session_config('${AUDIT_REASON_KEY}', NULL), -- reason,
        get_session_config('${AUDIT_MIGRATION_CONTEXT_KEY}', NULL), -- migration_context,
        NEW.created_at,           -- created_at
        NEW.updated_at,           -- updated_at
        NEW.deleted_at,           -- deleted_at
        to_jsonb(NEW.*)           -- record_data
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'migration_context');

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
        record_created_at,
        record_updated_at,
        record_deleted_at,
        record_data
      ) VALUES (
        TG_RELID,                 -- table_oid
        TG_TABLE_SCHEMA,          -- table_schema
        TG_TABLE_NAME,            -- table_name
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
        NEW.id,                   -- record_id
        local_system_fact('${FACT_DEVICE_ID}', 'unknown'), -- device_id,
        local_system_fact('${FACT_CURRENT_VERSION}', 'unknown'), -- version,
        get_session_config('${AUDIT_REASON_KEY}', NULL), -- reason,
        NEW.created_at,           -- created_at
        NEW.updated_at,           -- updated_at
        NEW.deleted_at,           -- deleted_at
        to_jsonb(NEW.*)           -- record_data
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
}
