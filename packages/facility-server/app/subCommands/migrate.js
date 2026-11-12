import { Command } from 'commander';
import { createMigrateCommand } from '@tamanu/database/services/migrations';
import { initDatabase } from '../database';
import { VERSION } from '../middleware/versionCompatibility';

// This is the "just-migrate" command for running database migrations only
// Note: there's also a 'migrate' alias on the 'upgrade' command for deployment safety, which
// includes database migrations plus automated upgrade steps
async function migrate(direction, options = {}) {
  const context = await initDatabase();
  await context.sequelize.migrate(direction, { ...options, serverVersion: VERSION });
  // process.exit() drops stdout still buffered for a pipe, so let `list` output drain first
  await new Promise(resolve => {
    process.stdout.write('', resolve);
  });
  // `list --check` reports pending migrations through process.exitCode
  process.exit();
}

export const migrateCommand = createMigrateCommand(Command, migrate, 'just-migrate');
