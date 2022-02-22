import { Command } from 'commander';
import { createMigrateCommand } from 'shared/services/migrations';
import { initDatabase } from '../database';

async function migrate(options) {
  const context = await initDatabase();
  await context.sequelize.migrate(options);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command).action(migrate);
