import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';
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

const recordChangeFunction = ({
  extraColumns = '',
  extraValues = '',
}: { extraColumns?: string; extraValues?: string } = {}) => `
  CREATE OR REPLACE FUNCTION logs.record_change()
  RETURNS trigger AS $$
  DECLARE
    changed_record record;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      changed_record := OLD;
    ELSE
      changed_record := NEW;
    END IF;

    IF logs.is_audit_changes_enabled() THEN
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
        record_deleted_at,${extraColumns}
        record_data
      ) VALUES (
        TG_RELID,                 -- table_oid
        TG_TABLE_SCHEMA,          -- table_schema
        TG_TABLE_NAME,            -- table_name
        get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
        changed_record.id,        -- record_id
        local_system_fact('${FACT_DEVICE_ID}', 'unknown'), -- device_id,
        local_system_fact('${FACT_CURRENT_VERSION}', 'unknown'), -- version,
        get_session_config('${AUDIT_REASON_KEY}', NULL), -- reason,
        get_session_config('${AUDIT_MIGRATION_CONTEXT_KEY}', NULL), -- migration_context,
        changed_record.created_at, -- created_at
        changed_record.updated_at, -- updated_at
        changed_record.deleted_at, -- deleted_at${extraValues}
        to_jsonb(changed_record)  -- record_data
      );
    END IF;

    RETURN changed_record;
  END;
  $$ LANGUAGE plpgsql;
`;

// Read the trigger name rather than rebuilding it from the table: tables renamed since
// their trigger was created keep the old name (prescriptions carries
// record_encounter_medications_changelog).
const changelogTriggers = (query: QueryInterface) =>
  query.sequelize.query<{ schema: string; table: string; name: string }>(
    `
      SELECT
        n.nspname AS schema,
        c.relname AS table,
        t.tgname AS name
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE t.tgname LIKE 'record_%_changelog'
        AND NOT t.tgisinternal
      ORDER BY n.nspname, c.relname, t.tgname
    `,
    { type: QueryTypes.SELECT },
  );

const recreateChangelogTriggers = async (query: QueryInterface, events: string) => {
  for (const { schema, table, name } of await changelogTriggers(query)) {
    await query.sequelize.query(`DROP TRIGGER "${name}" ON "${schema}"."${table}"`);
    await query.sequelize.query(`
      CREATE CONSTRAINT TRIGGER "${name}"
      AFTER ${events} ON "${schema}"."${table}"
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW
      EXECUTE FUNCTION logs.record_change();
    `);
  }
};

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'is_hard_delete', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.sequelize.query(
    recordChangeFunction({
      extraColumns: '\n        is_hard_delete,',
      extraValues: "\n        TG_OP = 'DELETE',    -- is_hard_delete",
    }),
  );

  await recreateChangelogTriggers(query, 'INSERT OR UPDATE OR DELETE');
}

export async function down(query: QueryInterface): Promise<void> {
  await recreateChangelogTriggers(query, 'INSERT OR UPDATE');
  await query.sequelize.query(recordChangeFunction());

  // DESTRUCTIVE: rows already logged for hard deletes remain, but become indistinguishable
  // from updates
  await query.removeColumn(TABLE, 'is_hard_delete');
}
