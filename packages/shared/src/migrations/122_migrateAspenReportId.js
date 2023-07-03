export async function up(query) {
  await query.sequelize.query(`
    UPDATE
      report_requests
    SET
      report_type = 'encounter-summary-line-list'
    WHERE
      report_type = 'fiji-aspen-encounter-summary-line-list';
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    UPDATE
      report_requests
    SET
      report_type = 'fiji-aspen-encounter-summary-line-list'
    WHERE
      report_type = 'encounter-summary-line-list';
  `);
}
