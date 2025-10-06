import type { Sequelize } from "sequelize";

// Adding migration context depends on the presence of session config functions.
// Also, we don't need to add context to the migration that 
// creates the session config functions as it will error.
export const checkIsMigrationContextAvailable = async (sequelize: Sequelize, migrationName: string): Promise<boolean> => {
  const [result] = await sequelize.query(`
    SELECT COUNT(*) as count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('get_session_config', 'set_session_config');
  `);

  const count = parseInt((result[0] as { count: string }).count, 10);
  return count === 2 && !migrationName.includes('1739969510355-sessionConfigFunctions');
}
