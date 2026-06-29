import { syncDatabaseServerVersion } from '@tamanu/database';

import { version } from '../serverInfo';

export async function prepareDatabaseForStartup(context, { skipMigrationCheck }) {
  if (process.env.MIGRATE_ON_STARTUP === 'true') {
    await context.sequelize.migrate('up', { serverVersion: version });
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
    await syncDatabaseServerVersion({
      models: context.models,
      serverVersion: version,
    });
  }
}
