import type { Sequelize } from 'sequelize';

// Migration context requires set_session_config (defined by the baseline).
// Probe inside a savepoint so the outer migration transaction isn't aborted
// when the function is unavailable (e.g. pre-baseline installs).
export const checkIsMigrationContextAvailable = async (sequelize: Sequelize): Promise<boolean> => {
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
      // Savepoint may not exist if the connection is in a bad state.
    }
    return false;
  }
};
