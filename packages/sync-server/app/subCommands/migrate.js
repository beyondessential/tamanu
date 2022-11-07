import { Command } from 'commander';
import { createMigrateCommand } from 'shared/services/migrations';
import { initDatabase } from '../database';

async function migrate(direction, args) {
  const store = await initDatabase({ testMode: false });
  await store.sequelize.migrate(direction, args);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command, migrate);
