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
 */

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX job_payload_resource_idx ON fhir.jobs
    USING btree ((payload->>'resource'))
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS fhir.job_payload_resource_idx
  `);
}
