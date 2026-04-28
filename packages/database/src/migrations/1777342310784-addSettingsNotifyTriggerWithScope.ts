import { QueryInterface } from 'sequelize';

// The shared `notify_table_changed` trigger emits only `{ table, event, oldId, newId,
// changedColumns }`. The settings cache invalidator and the websocket service both
// need to know the row's scope/facilityId to:
//   - selectively invalidate per-facility caches (rather than blowing away every facility)
//   - tell the web frontend to ignore changes for other facilities or central-only scopes
//
// The previous approach (looking up the row in JS via `Setting.findByPk`) was racy for
// deleted rows and for updated rows (the row may have been updated
// again by the time the lookup resolves). Embedding scope/facility_id in the NOTIFY
// payload itself eliminates both races: the values are read inside the trigger from
// the exact tuple version that fired the trigger.
const NOTIFY_SETTINGS_CHANGED_FUNCTION = `
  CREATE OR REPLACE FUNCTION public.notify_settings_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      event_name text;
      payload json;
      changes text[];
      changed_scope text;
      changed_facility_id text;
      changed_key text;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        event_name := 'INSERT';
        changed_scope := NEW.scope;
        changed_facility_id := NEW.facility_id;
        changed_key := NEW.key;
      ELSIF TG_OP = 'UPDATE' THEN
        event_name := 'UPDATE';
        changed_scope := NEW.scope;
        changed_facility_id := NEW.facility_id;
        changed_key := NEW.key;
        SELECT array_agg(changed_columns.column_name) FROM (
            SELECT old_json.key AS column_name
            FROM jsonb_each(to_jsonb(OLD)) AS old_json
            CROSS JOIN jsonb_each(to_jsonb(NEW)) AS new_json
            WHERE old_json.key = new_json.key AND new_json.value IS DISTINCT FROM old_json.value AND old_json.key NOT IN ('created_at','updated_at','deleted_at','updated_at_sync_tick','updated_at_by_field')
          ) as changed_columns INTO changes;
      ELSIF TG_OP = 'DELETE' THEN
        event_name := 'DELETE';
        changed_scope := OLD.scope;
        changed_facility_id := OLD.facility_id;
        changed_key := OLD.key;
      END IF;

      payload := json_build_object(
        'table', TG_TABLE_NAME,
        'event', event_name,
        'oldId', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.id END,
        'newId', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.id END,
        'changedColumns', changes,
        'scope', changed_scope,
        'facilityId', changed_facility_id,
        'key', changed_key
      );

      PERFORM pg_notify('table_changed', payload::text);

      RETURN NEW;
    END;
    $$;
`;

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(NOTIFY_SETTINGS_CHANGED_FUNCTION);
  await query.sequelize.query('DROP TRIGGER IF EXISTS notify_settings_changed ON public.settings');
  await query.sequelize.query(`
    CREATE TRIGGER notify_settings_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_settings_changed();
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP TRIGGER IF EXISTS notify_settings_changed ON public.settings');
  await query.sequelize.query(`
    CREATE TRIGGER notify_settings_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_table_changed();
  `);
  await query.sequelize.query('DROP FUNCTION IF EXISTS public.notify_settings_changed()');
}
