// n.b. this migration contains an update to the function created in migration 131
// for the original version, see that migration or the down in this migration
const CURRENT_SYNC_TIME_KEY = 'currentSyncTick';

const NEW_METADATA_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'updated_at_sync_tick',
  'updated_at_by_field',
];

const OLD_METADATA_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'updated_at_sync_tick',
  'updated_at_by_field',
];

export async function up(query) {
  await query.sequelize.query(`
    -- unless the updated_at_by_field was explicitly provided (i.e. by a sync merge update),
    -- set any fields updated in this query to use the latest sync tick
    CREATE OR REPLACE FUNCTION set_updated_at_by_field()
      RETURNS trigger
      LANGUAGE plpgsql AS
      $func$
      BEGIN

        -- INSERTS
        IF TG_OP = 'INSERT' THEN

          -- if this is a fresh record insert, and updated_at_by_field is set, it indicates the value
          -- has been explicitly passed (e.g. by a sync merge), so return early rather than
          -- overwriting it
          IF NEW.updated_at_by_field IS NOT NULL THEN
            RETURN NEW;
          END IF;

          -- the user has not included updated_at_by_field in the insert, calculate what it should be
          SELECT JSON_OBJECT_AGG(new_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb
          FROM jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE new_json.value <> 'null'::jsonb AND new_json.key NOT IN (${NEW_METADATA_FIELDS.map(
            m => `'${m}'`,
          ).join(',')})
          INTO NEW.updated_at_by_field;
          RETURN NEW;

        END IF;


        -- UPDATES
        IF TG_OP = 'UPDATE' THEN

          -- if this is an update to an existing record, and the updated_at_by_field is different in
          -- the new version, it indicates the value has been explicitly passed (e.g. by a sync merge),
          -- so return early rather than overwriting it
          IF OLD.updated_at_by_field::text <> NEW.updated_at_by_field::text THEN
            RETURN NEW;
          END IF;

          -- the updated_at_by_field has not been changed in the update, calculate it as it has
          -- _probably_ not been explicitly set by the client
          -- note the "probably": there could be a sync merge that happens to result in an unchanged
          -- updated_at_by_field, and this would recalculate and overwrite it, but pleasingly this
          -- case would only occur when none of the field values has been changed during the sync
          -- merge, so the recalculated updated_at_by_field here will also be unchanged!
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT value::bigint FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key NOT IN (${NEW_METADATA_FIELDS.map(
              m => `'${m}'`,
            ).join(',')})
          ) as changed_columns INTO NEW.updated_at_by_field;
          RETURN NEW;

        END IF;
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
          SELECT JSON_OBJECT_AGG(new_json.key, (SELECT value::bigint FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb
          FROM jsonb_each(to_jsonb(NEW)) AS new_json
          WHERE new_json.value <> 'null'::jsonb AND new_json.key NOT IN (${OLD_METADATA_FIELDS.map(
            m => `'${m}'`,
          ).join(',')})
          INTO NEW.updated_at_by_field;
        ELSIF (OLD.updated_at_by_field IS NULL OR OLD.updated_at_by_field::text = NEW.updated_at_by_field::text) THEN
          SELECT COALESCE(OLD.updated_at_by_field::jsonb, '{}'::jsonb) || COALESCE(JSON_OBJECT_AGG(changed_columns.column_name, (SELECT value::bigint FROM local_system_facts WHERE key = '${CURRENT_SYNC_TIME_KEY}'))::jsonb, '{}'::jsonb) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key NOT IN (${OLD_METADATA_FIELDS.map(
              m => `'${m}'`,
            ).join(',')})
          ) as changed_columns INTO NEW.updated_at_by_field;
        END IF;
        RETURN NEW;
      END
      $func$;
  `);
}
