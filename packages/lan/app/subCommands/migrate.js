import { Command } from 'commander';
import { createMigrateCommand } from 'shared/services/migrations';
import { initDatabase } from '../database';

async function migrate(action, args) {
  const context = await initDatabase();
  await context.sequelize.migrate(action, args);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command, migrate);
