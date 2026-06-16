import config from 'config';
import { syncDatabaseServerVersion } from '@tamanu/database';

import { version } from '../serverInfo';

export async function prepareDatabaseForStartup(
  context,
  { skipMigrationCheck, skipVersionCompatibilityCheck },
) {
  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up', {
      serverVersion: version,
      skipVersionCompatibilityCheck,
    });
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
    await syncDatabaseServerVersion({
      models: context.models,
      serverVersion: version,
      skipVersionCompatibilityCheck,
    });
  }
}
