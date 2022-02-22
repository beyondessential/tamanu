import { Command } from 'commander';
import { createMigrateCommand } from 'shared/services/migrations';
import { initDatabase } from '../database';

async function migrate(options) {
  const store = await initDatabase({ testMode: false });
  await store.sequelize.migrate(options);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command).action(migrate);
