import { Command } from 'commander';
import { upgrade } from '@tamanu/upgrade';
import { initDatabase } from '../database';
import { VERSION } from '../middleware/versionCompatibility';
import { assertSyncLookupTableIsConsistent } from '../sync/assertSyncLookupTableIsConsistent';

export const upgradeCommand = new Command('upgrade')
  // 'migrate' alias for safety - prevents accidentally forgetting to use 'upgrade' for deployments
  // or having to version match for the correct migrate command
  .alias('migrate')
  .description('Upgrade Tamanu installation')
  .option(
    '--dry-run',
    'Run the upgrade in a transaction then roll back, without committing any changes',
  )
  .action(async (options) => {
    const { sequelize, models } = await initDatabase({ testMode: false });
    try {
      const dryRun = Boolean(options.dryRun);
      await upgrade({
        sequelize,
        models,
        toVersion: VERSION,
        serverType: 'central',
        dryRun,
      });

      // Skip the gate for dry runs: upgrade() already rolled back inside its own transaction, so
      // a rebuild here would run for real, outside that transaction.
      if (!dryRun) {
        await assertSyncLookupTableIsConsistent({ sequelize, models });
      }

      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
