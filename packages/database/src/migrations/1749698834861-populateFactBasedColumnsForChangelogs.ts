import { AUDIT_USERID_KEY, FACT_CURRENT_VERSION, FACT_DEVICE_ID } from '@tamanu/constants';
import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
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
