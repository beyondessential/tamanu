/** @typedef {import('sequelize').QueryInterface} QueryInterface */
/**
 * @param {QueryInterface} query
 */
const METADATA_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'updated_at_sync_tick',
  'updated_at_by_field',
];

export async function up(query) {
  await query.sequelize.query(`
CREATE OR REPLACE FUNCTION notify_table_changed() RETURNS TRIGGER AS $$
    DECLARE
      event_name text;
      payload json;
      changes text[];
    BEGIN
      -- Determine the operation that caused the trigger
      IF TG_OP = 'INSERT' THEN
        event_name := 'INSERT';
      ELSIF TG_OP = 'UPDATE' THEN
        event_name := 'UPDATE';
      ELSIF TG_OP = 'DELETE' THEN
        event_name := 'DELETE';
      ELSIF TG_OP = 'TRUNCATE' THEN
        event_name := 'TRUNCATE';
      END IF;

      IF TG_OP = 'UPDATE' THEN
        SELECT array_agg(changed_columns.column_name) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value  AND old_json.key NOT IN (${METADATA_FIELDS.map(
              m => `'${m}'`,
            ).join(',')})
          ) as changed_columns INTO changes;
      END IF;

      -- Create the JSON payload with table name and event name
      payload := json_build_object(
        'table', TG_TABLE_NAME,
        'event', event_name,
        'oldId', OLD.id,
		    'newId', NEW.id,
        'changedColumns', changes
      );

      -- Send notification to the 'table_changed' channel with the JSON payload
      PERFORM pg_notify('table_changed', payload::text);

      RETURN NEW;  -- Return the updated row
    END;
    $$ LANGUAGE plpgsql;
  `);
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.sequelize.query('DROP FUNCTION IF EXISTS notify_table_changed CASCADE');
}
