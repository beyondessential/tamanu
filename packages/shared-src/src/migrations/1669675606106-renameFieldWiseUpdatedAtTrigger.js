const OLD_SYNC_TIME_KEY = 'currentSyncTime';
const NEW_SYNC_TICK_KEY = 'currentSyncTick';

const METADATA_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'updated_at_sync_tick',
  'updated_at_by_field',
];

// copied from migration 131 with updated key
export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at_by_field()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        -- unless the updated_at_by_field was explicitly provided (i.e. by a sync merge update),
        -- set any fields updated in this query to use the latest sync tick
        IF (OLD IS NULL) THEN
          SELECT JSON_OBJECT_AGG(new_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = '${NEW_SYNC_TICK_KEY}'))::jsonb
          FROM jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE new_json.value <> 'null'::jsonb AND new_json.key NOT IN (${METADATA_FIELDS.map(
            m => `'${m}'`,
          ).join(',')})
          INTO NEW.updated_at_by_field;
        ELSIF (OLD.updated_at_by_field IS NULL OR OLD.updated_at_by_field::text = NEW.updated_at_by_field::text) THEN
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT value::bigint FROM local_system_facts WHERE key = '${NEW_SYNC_TICK_KEY}'))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key NOT IN (${METADATA_FIELDS.map(
              m => `'${m}'`,
            ).join(',')})
          ) as changed_columns INTO NEW.updated_at_by_field;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at_by_field()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        -- unless the updated_at_by_field was explicitly provided (i.e. by a sync merge update),
        -- set any fields updated in this query to use the latest sync tick
        IF (OLD IS NULL) THEN
          SELECT JSON_OBJECT_AGG(new_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = '${OLD_SYNC_TIME_KEY}'))::jsonb
          FROM jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE new_json.value <> 'null'::jsonb AND new_json.key NOT IN (${METADATA_FIELDS.map(
            m => `'${m}'`,
          ).join(',')})
          INTO NEW.updated_at_by_field;
        ELSIF (OLD.updated_at_by_field IS NULL OR OLD.updated_at_by_field::text = NEW.updated_at_by_field::text) THEN
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT value::bigint FROM local_system_facts WHERE key = '${OLD_SYNC_TIME_KEY}'))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key NOT IN (${METADATA_FIELDS.map(
              m => `'${m}'`,
            ).join(',')})
          ) as changed_columns INTO NEW.updated_at_by_field;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}
