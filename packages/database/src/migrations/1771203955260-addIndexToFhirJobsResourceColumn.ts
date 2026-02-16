import { QueryInterface } from 'sequelize';

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
