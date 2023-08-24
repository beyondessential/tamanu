// TODO: finalize this
const REPORTING_SCHEMA_NAME = 'reporting';

export async function up(query) {
  // Create tamanu_dataset_reporting role
  await query.sequelize.query(`
   CREATE ROLE tamanu_dataset_reporting;
   ALTER ROLE tamanu_dataset_reporting SET search_path TO ${REPORTING_SCHEMA_NAME};
   GRANT USAGE ON SCHEMA ${REPORTING_SCHEMA_NAME} TO tamanu_dataset_reporting;
   GRANT SELECT ON ALL TABLES IN SCHEMA ${REPORTING_SCHEMA_NAME} TO tamanu_dataset_reporting;
  `);

  // Create tamanu_raw_reporting role
  await query.sequelize.query(`
   CREATE ROLE tamanu_raw_reporting;
   ALTER ROLE tamanu_raw_reporting SET search_path TO public;
   GRANT USAGE ON SCHEMA public TO tamanu_raw_reporting;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO tamanu_raw_reporting;
  `);
}

// TODO: Is it safe to drop owned by for these transient roles with only usages
export async function down(query) {
  await query.sequelize.query(`
    DROP OWNED BY tamanu_dataset_reporting;
    DROP ROLE tamanu_dataset_reporting;
  `);
  await query.sequelize.query(`
    DROP OWNED BY tamanu_raw_reporting;
    DROP ROLE tamanu_raw_reporting;
  `);
}
