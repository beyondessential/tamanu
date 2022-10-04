const CURRENT_SYNC_TIME_KEY = 'currentSyncTime';

export async function up(query) {
  await query.sequelize.query(`
    CREATE FUNCTION set_updated_at_by_field()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        -- unless the updated_at_by_field was explicitly provided (i.e. by a sync merge update),
        -- set any fields updated in this query to use the latest sync tick
        IF (OLD IS NULL) THEN
          SELECT JSON_OBJECT_AGG(new_json.key, (SELECT value FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb
          FROM jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE new_json.value <> 'null'::jsonb AND new_json.key <> 'updated_at_sync_tick' AND new_json.key <> 'updated_at_by_field'
          INTO NEW.updated_at_by_field;
        ELSIF (OLD.updated_at_by_field IS NULL OR OLD.updated_at_by_field::text = NEW.updated_at_by_field::text) THEN
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT value FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key <> 'updated_at_sync_tick' AND old_json.key <> 'updated_at_by_field'
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
