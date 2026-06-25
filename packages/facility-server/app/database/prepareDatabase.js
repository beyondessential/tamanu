import config from 'config';
import { syncDatabaseServerVersion } from '@tamanu/database';

import { version } from '../serverInfo';

export async function prepareDatabaseForStartup(context, { skipMigrationCheck }) {
  if (config.db.migrateOnStartup) {
    await context.sequelize.migrate('up', { serverVersion: version });
  } else {
    await context.sequelize.assertUpToDate({ skipMigrationCheck });
    await syncDatabaseServerVersion({
      models: context.models,
      serverVersion: version,
    });
  }
}
