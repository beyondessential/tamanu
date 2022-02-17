import { Command } from 'commander';

import { addMigrateOptions } from 'shared/services/migrations';
import { initDatabase } from '../database';

export async function migrate(options) {
  const store = await initDatabase({ testMode: false });
  await store.sequelize.migrate(options);
  process.exit(0);
}

export const migrateCommand = new Command('migrate')
  .description('Apply or roll back database migrations')
  .action(migrate);
addMigrateOptions(migrateCommand);
