import { QueryInterface } from 'sequelize';
import { SESSION_CONFIG_PREFIX } from '@tamanu/constants/database';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION get_session_config(key TEXT, default_value TEXT)
    RETURNS text AS $$
    DECLARE
      full_key TEXT = '${SESSION_CONFIG_PREFIX}' || key;
    BEGIN
      RETURN coalesce(nullif(current_setting(full_key, true), ''), default_value);
    END;
    $$ LANGUAGE plpgsql;
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_session_config(key TEXT, value TEXT, is_local BOOLEAN DEFAULT FALSE)
    RETURNS void AS $$
    DECLARE
      full_key TEXT = '${SESSION_CONFIG_PREFIX}' || key;
    BEGIN
      PERFORM set_config(full_key, value, is_local);
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP FUNCTION get_session_config CASCADE');
  await query.sequelize.query('DROP FUNCTION set_session_config CASCADE');
}
