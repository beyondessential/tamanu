export async function up(query) {
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS check_valid_resource_type
    ON fhir.jobs;
  `);

  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS check_valid_resource_type;
  `);
}

export async function down(query) {
  // each deployment may have different versions of check_valid_resource_type so best not to revert it
}
