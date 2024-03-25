// In a hot-fix for some deployments, we turned off materialisation of some FHIR resources through a pre-insert
// trigger on `fhir.jobs`. In this release, which resources get materialised is configurable, so we no longer need
// the db hack to do that
export async function up(query) {
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS check_valid_resource_type
    ON fhir.jobs;
  `);

  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS check_valid_resource_type;
  `);
}

export async function down() {
  // each deployment may have different versions of check_valid_resource_type so best not to revert it
}
