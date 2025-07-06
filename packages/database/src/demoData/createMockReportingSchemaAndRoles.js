import config from 'config';
import { QueryTypes } from 'sequelize';

// Create a mock reporting schema and reporting users for testing
// Relatively unsafe as creates roles and schemas in the database
export async function createMockReportingSchemaAndRoles({ sequelize }) {
  const { raw, reporting } = config.db.reportSchemas.connections;
  const [{ exists: rolesExist }] = await sequelize.query(
    `SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = '${reporting.username}')`,
    { type: QueryTypes.SELECT },
  );
  if (rolesExist) {
    return;
  }
  await sequelize.query(`
    CREATE SCHEMA IF NOT EXISTS reporting;
    CREATE ROLE ${reporting.username} WITH
      LOGIN 
      PASSWORD '${reporting.password}';
    CREATE ROLE ${raw.username} WITH
      LOGIN 
      PASSWORD '${raw.password}';
    ALTER ROLE ${reporting.username} SET search_path TO reporting;
    GRANT USAGE ON SCHEMA reporting TO ${reporting.username};
    GRANT USAGE ON SCHEMA public TO ${raw.username};
    GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO ${reporting.username};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${raw.username};
  `);
}
