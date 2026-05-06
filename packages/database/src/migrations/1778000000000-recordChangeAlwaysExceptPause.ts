import { QueryInterface } from 'sequelize';
import { AUDIT_PAUSE_KEY } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION logs.is_audit_changes_enabled ()
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE PARALLEL SAFE
      AS $$
    BEGIN
      IF get_session_config ('${AUDIT_PAUSE_KEY}', 'false')::boolean THEN
        RETURN FALSE;
      END IF;
      RETURN TRUE;
    END;
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION logs.is_audit_changes_enabled ()
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE PARALLEL SAFE
      AS $$
    BEGIN
      IF get_session_config ('${AUDIT_PAUSE_KEY}', 'false')::boolean THEN
        RETURN FALSE;
      END IF;
      RETURN coalesce((
        SELECT
          value::boolean
        FROM settings
        WHERE
          key = 'audit.changes.enabled'
          AND scope = 'global'), FALSE);
    END;
    $$;
  `);
}
