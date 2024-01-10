import { Command } from 'commander';
import { createMigrateCommand } from '@tamanu/shared/services/migrations';
import { initDatabase } from '../database';

async function migrate(direction) {
  const context = await initDatabase();
  await context.sequelize.migrate(direction);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command, migrate);
