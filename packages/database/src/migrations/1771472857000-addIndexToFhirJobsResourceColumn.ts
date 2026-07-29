import { QueryInterface } from 'sequelize';

/**
 * Migration to add an index on the 'resource' field within the JSONB payload column
 * of the fhir.jobs table.
 *
 * Context:
 * - The fhir.jobs table has a JSONB 'payload' column that contains a 'resource' field
 * - The resource field identifies the FHIR resource type (Patient, Encounter, etc.)
 * - Jobs are created and queried based on the resource type (see FhirMissingResources.js)
 * - Adding an index on payload->>'resource' will improve query performance when
 *   filtering or grouping jobs by resource type
 *
 * Idempotent: some environments already have this index (e.g. created manually). Create only if
 * missing; if present with a non-btree access method, replace it with btree (ALTER INDEX cannot
 * change access method).
 */

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DO $$
    DECLARE
      idx_access_method name;
    BEGIN
      SELECT a.amname INTO idx_access_method
      FROM pg_class i
      JOIN pg_namespace n ON n.oid = i.relnamespace
      JOIN pg_am a ON a.oid = i.relam
      WHERE i.relname = 'job_payload_resource_idx'
        AND n.nspname = 'fhir';

      IF idx_access_method IS NULL THEN
        CREATE INDEX job_payload_resource_idx ON fhir.jobs
          USING btree ((payload->>'resource'));
      ELSIF idx_access_method <> 'btree' THEN
        DROP INDEX fhir.job_payload_resource_idx;
        CREATE INDEX job_payload_resource_idx ON fhir.jobs
          USING btree ((payload->>'resource'));
      END IF;
    END $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS fhir.job_payload_resource_idx
  `);
}
