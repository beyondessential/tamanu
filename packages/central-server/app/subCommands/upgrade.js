import { Command } from 'commander';
import { upgrade } from '@tamanu/upgrade';
import { initDatabase } from '../database';
import { VERSION } from '../middleware/versionCompatibility';
import { CentralSyncManager } from '../sync/CentralSyncManager';

// After migrations, run the sync_lookup rebuild (both passes) and refuse to complete the upgrade
// if any row is still flagged needs_rebuild — migrations run during downtime, so no source record
// can be written mid-build, making a clean rebuild a reliable signal the lookup table has caught
// up with everything migrations changed. Lives here (not in @tamanu/upgrade) because the rebuild
// logic lives in @tamanu/central-server, which @tamanu/upgrade must not import.
async function assertSyncLookupTableIsConsistent({ sequelize, models }) {
  const centralSyncManager = new CentralSyncManager({
    store: { sequelize, models },
    onClose: () => {},
  });
  await centralSyncManager.updateLookupTable();

  const [[{ count }]] = await sequelize.query(
    'SELECT count(*) AS count FROM sync_lookup WHERE needs_rebuild',
  );
  const needsRebuildCount = parseInt(count, 10);
  if (needsRebuildCount > 0) {
    throw new Error(
      `Upgrade blocked: ${needsRebuildCount} sync_lookup row(s) still need rebuild after the migration gate rebuild.`,
    );
  }
}

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
