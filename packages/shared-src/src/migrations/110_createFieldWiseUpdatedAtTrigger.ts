export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_at_by_field()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        RAISE NOTICE 'here';
        SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || JSON_OBJECT_AGG(changed_columns.column_name, (SELECT last_value FROM sync_session_sequence))::jsonb FROM (
          SELECT old_json.key AS column_name
          FROM jsonb_each(to_jsonb(OLD)) AS old_json
          CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value
        ) as changed_columns INTO NEW.updated_at_by_field;
        RAISE NOTICE 'Value: %', NEW.updated_at_by_field;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION set_updated_at_by_field');
}
