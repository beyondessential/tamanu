export async function up(query) {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      imaging_results_imaging_request_id
    ON
      imaging_results (imaging_request_id)
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX
      imaging_results_imaging_request_id
  `);
}
