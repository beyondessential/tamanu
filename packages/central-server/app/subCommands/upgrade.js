import { Command } from 'commander';
import { upgrade } from '@tamanu/upgrade';
import { initDatabase } from '../database';
import { VERSION } from '../middleware/versionCompatibility';

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
      await upgrade({
        sequelize,
        models,
        toVersion: VERSION,
        serverType: 'central',
        dryRun: Boolean(options.dryRun),
      });
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
