import type { Sequelize } from "sequelize";

// Adding migration context depends on the presence of session config functions.
// Also, we don't need to add context to the migration that
// creates the session config functions as it will error.
// Uses a savepoint-protected probe to verify the function is actually callable,
// not just present in pg_proc (which can be stale in some edge cases).
export const checkIsMigrationContextAvailable = async (sequelize: Sequelize, migrationName: string): Promise<boolean> => {
  if (migrationName.includes('1739969510355-sessionConfigFunctions')) {
    return false;
  }

  try {
    await sequelize.query('SAVEPOINT _migration_context_probe');
    await sequelize.query(
      "SELECT public.set_session_config('tamanu._migration_probe', '', true)",
    );
    await sequelize.query('RELEASE SAVEPOINT _migration_context_probe');
    return true;
  } catch {
    try {
      await sequelize.query('ROLLBACK TO SAVEPOINT _migration_context_probe');
    } catch {
      // savepoint itself may not exist if the connection is in a bad state
    }
    return false;
  }
}
