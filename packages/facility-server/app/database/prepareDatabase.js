import { syncDatabaseServerVersion } from '@tamanu/database';
import { checkConfigKey } from '@tamanu/upgrade';

import { version } from '../serverInfo';

export async function prepareDatabaseForStartup(context, { skipMigrationCheck }) {
  if (process.env.MIGRATE_ON_STARTUP === 'true') {
    // Migrating on startup skips the upgrade, which moves stored secrets onto the configured key.
    await checkConfigKey(context.sequelize);
    await context.sequelize.migrate('up', { serverVersion: version });
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
    await syncDatabaseServerVersion({
      models: context.models,
      serverVersion: version,
    });
  }
}
