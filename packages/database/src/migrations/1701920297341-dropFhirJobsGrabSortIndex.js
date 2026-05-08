export async function up(query) {
  await query.sequelize.query(`DROP INDEX IF EXISTS fhir."job_grab_sort_idx"`);
}

export async function down(query) {
  await query.sequelize.query(`
    CREATE INDEX job_grab_sort_idx ON fhir.jobs
    USING btree (priority DESC, created_at ASC)
  `);
}
