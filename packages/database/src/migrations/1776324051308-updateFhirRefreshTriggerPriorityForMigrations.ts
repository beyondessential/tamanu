import { QueryInterface } from 'sequelize';
import { JOB_PRIORITIES } from '@tamanu/constants';

const MIGRATION_PRIORITY = (JOB_PRIORITIES as Record<string, number>).MIGRATION;

const TRIGGER_FUNCTION_WITH_MIGRATION_PRIORITY = `
  CREATE OR REPLACE FUNCTION fhir.refresh_trigger()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
  AS $$
  DECLARE
    payload JSONB;
    at_priority INTEGER;
  BEGIN
    payload := jsonb_build_object(
      'table', (TG_TABLE_SCHEMA::text || '.' || TG_TABLE_NAME::text),
      'op', TG_OP,
      'id', COALESCE(NEW.id, OLD.id)::text,
      'args', to_jsonb(TG_ARGV)
    );

    IF TG_OP = 'DELETE' THEN
      payload := payload || jsonb_build_object('deletedRow', OLD);
    END IF;

    at_priority := CASE
      WHEN coalesce(nullif(current_setting('tamanu.audit.migration_context', true), ''), NULL) IS NOT NULL
        THEN ${MIGRATION_PRIORITY}
      ELSE ${JOB_PRIORITIES.DEFAULT}
    END;

    PERFORM fhir.job_submit('fhir.refresh.allFromUpstream', payload, at_priority);
    RETURN NEW;
  END;
  $$;
`;

const TRIGGER_FUNCTION_DEFAULT_PRIORITY = `
  CREATE OR REPLACE FUNCTION fhir.refresh_trigger()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
  AS $$
  DECLARE
    payload JSONB;
  BEGIN
    payload := jsonb_build_object(
      'table', (TG_TABLE_SCHEMA::text || '.' || TG_TABLE_NAME::text),
      'op', TG_OP,
      'id', COALESCE(NEW.id, OLD.id)::text,
      'args', to_jsonb(TG_ARGV)
    );

    IF TG_OP = 'DELETE' THEN
      payload := payload || jsonb_build_object('deletedRow', OLD);
    END IF;

    PERFORM fhir.job_submit('fhir.refresh.allFromUpstream', payload);
    RETURN NEW;
  END;
  $$;
`;

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(TRIGGER_FUNCTION_WITH_MIGRATION_PRIORITY);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(TRIGGER_FUNCTION_DEFAULT_PRIORITY);
}

