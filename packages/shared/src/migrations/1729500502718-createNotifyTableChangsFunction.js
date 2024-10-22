/** @typedef {import('sequelize').QueryInterface} QueryInterface */
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION notify_table_changed() RETURNS TRIGGER AS $$
    DECLARE
      event_name text;
      payload json;
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

      -- Create the JSON payload with table name and event name
      payload := json_build_object(
        'table', TG_TABLE_NAME,
        'event', event_name
      );

      -- Send notification to the 'table_changed' channel with the JSON payload
      PERFORM pg_notify('table_changed', payload::text);

      RETURN NULL;  -- Since this is an AFTER STATEMENT trigger, no row needs to be returned
    END;
    $$ LANGUAGE plpgsql;
  `);
}
/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.sequelize.query('DROP FUNCTION notify_table_changed()');
}
