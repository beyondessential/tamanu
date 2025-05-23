import { AUDIT_USERID_KEY } from '@tamanu/constants';
import { QueryInterface } from 'sequelize';

const TABLE = {
  tableName: 'changes',
  schema: 'logs',
}

export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'record_sync_tick');
  await query.removeColumn(TABLE, 'record_update');
  await query.removeColumn(TABLE, 'updated_at');
  await query.removeColumn(TABLE, 'deleted_at');
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
        to_jsonb(NEW.*)           -- record_data
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE logs.changes ADD COLUMN record_sync_tick bigint;
    UPDATE logs.changes SET record_sync_tick = (record_data->>'updated_at_sync_tick')::bigint;
  `);

  await query.sequelize.query(`
    ALTER TABLE logs.changes ADD COLUMN record_updated boolean;
    UPDATE logs.changes SET record_updated = (record_updated_at != record_created_at)::boolean;
    ALTER TABLE logs.changes ALTER COLUMN record_updated SET NOT NULL;
  `)

  await query.sequelize.query(`
    ALTER TABLE logs.changes ADD COLUMN updated_at timestamp with time zone;
    UPDATE logs.changes SET updated_at = created_at;
    ALTER TABLE logs.changes ALTER COLUMN updated_at SET NOT NULL;
  `)

  // There should be no deleted records in the changelog table
  await query.sequelize.query(`
    ALTER TABLE logs.changes ADD COLUMN deleted_at timestamp with time zone;
  `)

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
