// Please note this is a destructive migration so cannot be undone.
export async function up(query) {
  await query.sequelize.query(`
    DROP TABLE "fhir"."diagnostic_reports";
  `);
}

export async function down() {
  // unable to be undone
}
