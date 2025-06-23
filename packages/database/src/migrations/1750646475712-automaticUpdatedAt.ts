import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
     RETURNS trigger
     LANGUAGE plpgsql
    AS $function$
    BEGIN
        IF (
            NEW IS DISTINCT FROM OLD AND
            NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at
        ) THEN
            NEW.updated_at := current_timestamp;
        END IF;
        RETURN NEW;
    END;
    $function$
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE');
}
