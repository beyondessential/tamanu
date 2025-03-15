import { QueryInterface } from 'sequelize';
import { AUDIT_USERID_KEY, AUDIT_PAUSE_KEY } from '@tamanu/constants/database';

export async function up(query: QueryInterface): Promise<void> {
  await query.createFunction(
    'logs.record_change',
    [],
    'trigger',
    'plpgsql',
    `
    IF (SELECT get_session_config('${AUDIT_PAUSE_KEY}', 'false')::boolean) THEN
      RETURN NEW;
    END IF;

    INSERT INTO logs.changes (
      table_oid,
      table_schema,
      table_name,
      created_at,
      updated_at,
      deleted_at,
      record_id,
      record_update,
      record_sync_tick,
      record_data,
      author_id
    ) VALUES (
      TG_RELID,                 -- table_oid
      TG_TABLE_SCHEMA,          -- table_schema
      TG_TABLE_NAME,            -- table_name
      NEW.created_at,           -- created_at
      NEW.updated_at,           -- updated_at
      NEW.deleted_at,           -- deleted_at
      NEW.id,                   -- record_id
      TG_OP = 'UPDATE',         -- record_update
      NEW.updated_at_sync_tick, -- record_sync_tick
      to_jsonb(NEW.*),          -- record_data
      get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text)
    );
    RETURN NEW;
    `,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP FUNCTION logs.record_change CASCADE');
}
