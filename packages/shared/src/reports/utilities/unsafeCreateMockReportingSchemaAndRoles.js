import config from 'config';

// Create a mock reporting schema and reporting users for testing
export async function unsafeCreateMockReportingSchemaAndRoles({ sequelize }) {
  const { raw, reporting } = config.db.reports.credentials;
  await sequelize.query(`
    CREATE SCHEMA IF NOT EXISTS reporting;
    -- create roles if they don't exist this can happen on local dev when running tests
    DO $$
    BEGIN
    CREATE ROLE ${reporting.username} WITH
      LOGIN 
      PASSWORD '${reporting.password}';
    CREATE ROLE ${raw.username} WITH
      LOGIN 
      PASSWORD '${raw.password}';
    EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '%, skipping', SQLERRM USING ERRCODE = SQLSTATE;
    END
    $$;
    ALTER ROLE ${reporting.username} SET search_path TO reporting;
    GRANT USAGE ON SCHEMA reporting TO ${reporting.username};
    GRANT USAGE ON SCHEMA public TO ${raw.username};
    GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO ${reporting.username};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${raw.username};
  `);
}
