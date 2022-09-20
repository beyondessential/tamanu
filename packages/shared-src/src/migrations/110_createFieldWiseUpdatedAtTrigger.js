export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_at_by_field()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        -- unless the updated_at_by_field was explicitly provided (i.e. by a sync merge update),
        -- set any fields updated in this query to use the latest sync tick
        IF (OLD.updated_at_by_field IS NULL OR OLD.updated_at_by_field::text = NEW.updated_at_by_field::text) THEN
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT last_value FROM sync_clock_sequence))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key <> 'updated_at_sync_index'
          ) as changed_columns INTO NEW.updated_at_by_field;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION set_updated_at_by_field');
}
