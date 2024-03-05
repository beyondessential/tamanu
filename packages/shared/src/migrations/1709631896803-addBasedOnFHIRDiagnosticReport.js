export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE "fhir"."diagnostic_reports"
    ADD COLUMN "based_on" JSONB
    DEFAULT NULL;
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE "fhir"."diagnostic_reports"
    DROP COLUMN "based_on"
  `);
}
