import { Command } from 'commander';
import { createMigrateCommand } from '@tamanu/database/services/migrations';
import { initDatabase } from '../database';

// This is the "just-migrate" command for running database migrations only
// Note: there's also a 'migrate' alias on the 'upgrade' command for deployment safety, which
// includes database migrations plus automated upgrade steps
async function migrate(direction) {
  const context = await initDatabase();
  await context.sequelize.migrate(direction);
  process.exit(0);
}

export const migrateCommand = createMigrateCommand(Command, migrate, 'just-migrate');
