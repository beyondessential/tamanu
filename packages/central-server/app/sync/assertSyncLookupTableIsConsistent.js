import { CentralSyncManager } from './CentralSyncManager';

// Rebuilds sync_lookup (both passes) and throws if any row is still flagged needs_rebuild
// afterward. Used after a step that writes data outside the normal sync-tick-trigger flow —
// migrations (see upgrade.js) or provisioning (see rebuildSyncLookup.js) — so a clean rebuild is a
// reliable signal the lookup table has caught up with everything that step changed, and a facility
// syncing immediately afterward won't race an incomplete table.
export async function assertSyncLookupTableIsConsistent({ sequelize, models }) {
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
      `sync_lookup rebuild incomplete: ${needsRebuildCount} row(s) still need rebuild after the rebuild.`,
    );
  }
}
