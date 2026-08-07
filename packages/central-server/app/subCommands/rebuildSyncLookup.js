import { Command } from 'commander';
import { initDatabase } from '../database';
import { assertSyncLookupTableIsConsistent } from '../sync/assertSyncLookupTableIsConsistent';

// A step that writes data outside the normal sync-tick-trigger flow — provisioning is the main
// example — leaves sync_lookup stale until the next scheduled rebuild. The "has sync_lookup been
// built at all" guard a facility's first sync depends on (see CentralSyncManager.prepareSession)
// only checks that some build has happened, not that it's caught up with what just changed, so a
// facility syncing immediately after such a step can pass that guard while still missing
// everything the step created. Run this straight after that step to close the gap.
export const rebuildSyncLookupCommand = new Command('rebuildSyncLookup')
  .description('Rebuild the sync_lookup table and fail if any row is still flagged needs_rebuild')
  .action(async () => {
    const { sequelize, models } = await initDatabase({ testMode: false });
    try {
      await assertSyncLookupTableIsConsistent({ sequelize, models });
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });
