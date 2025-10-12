import { QueryInterface } from 'sequelize';

/**
 * Fix for soft delete timestamp inconsistency between raw tables and logs.changes
 * 
 * When records are soft deleted (deleted_at is set), the updated_at in the raw table
 * is correctly updated by the set_updated_at trigger, but the audit trigger captures
 * the old value because Sequelize may explicitly set updated_at in the UPDATE query,
 * preventing the BEFORE trigger from auto-updating it.
 * 
 * This fix ensures that whenever deleted_at is being set (soft delete), we always
 * update updated_at to the current timestamp, regardless of whether it was already
 * explicitly set in the query.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
     RETURNS trigger
     LANGUAGE plpgsql
    AS $function$
    BEGIN
        IF (to_jsonb(NEW) ? 'updated_at') THEN
            -- Check if this is a soft delete (deleted_at is being set)
            IF (to_jsonb(NEW) ? 'deleted_at' 
                AND NEW.deleted_at IS NOT NULL 
                AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)) THEN
                -- Always update updated_at during soft delete
                NEW.updated_at := current_timestamp;
            ELSIF (
                (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at')
                AND
                (to_jsonb(NEW)->'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD)->'updated_at')
            ) THEN
                -- Normal update: only set updated_at if it wasn't explicitly changed
                NEW.updated_at := current_timestamp;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $function$
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Revert to the previous version
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
