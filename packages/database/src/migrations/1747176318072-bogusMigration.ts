import { SYSTEM_USER_UUID } from '@tamanu/constants';
import type { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO settings (id, key, value) VALUES (uuid_generate_v5(uuid_nil(), 'test-key'), 'test-key', 'true');

    INSERT INTO logs.changes (
      table_oid,
      table_schema,
      table_name,
      logged_at,
      created_at,
      updated_at,
      deleted_at,
      updated_by_user_id,
      record_id,
      record_update,
      record_created_at,
      record_updated_at,
      record_deleted_at,
      record_sync_tick,
      record_data
    )
    SELECT
      (SELECT oid FROM pg_class WHERE relname = 'settings'),
      'public',
      'settings',
      now(),
      now(),
      now(),
      NULL,
      '${SYSTEM_USER_UUID}',
      s.id,
      TRUE,
      s.created_at,
      s.updated_at,
      s.deleted_at,
      0,
      to_jsonb(s.*)
    FROM settings s
    WHERE s.key = 'test-key';
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM logs.changes WHERE record_id = (SELECT id FROM settings WHERE key = 'test-key')::text;
    DELETE FROM settings WHERE key = 'test-key';
  `);
}
