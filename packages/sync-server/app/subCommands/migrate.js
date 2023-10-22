import { Command } from 'commander';
import { createMigrateCommand } from '@tamanu/shared/services/migrations';
import { initDatabase } from '../database';

async function migrate(direction) {
  const store = await initDatabase({ testMode: false });
  await store.sequelize.migrate(direction);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command, migrate);
