import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
     RETURNS trigger
     LANGUAGE plpgsql
    AS $function$
    BEGIN
        IF (to_jsonb(NEW) ? 'updated_at') THEN
            IF (
                (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at')
                AND
                (to_jsonb(NEW)->'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD)->'updated_at')
            ) THEN
                NEW.updated_at := current_timestamp;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $function$
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE');
}
