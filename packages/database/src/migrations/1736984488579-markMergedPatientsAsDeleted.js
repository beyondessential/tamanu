import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

// We had a "rename" patient merge strategy, which didn't soft delete merged patients
// instead, it just renamed them to "Delete Patient". This migration ensures that all
// patients that were merged with said strategy are properly deleted.
// Also, this one will only run on central, to be able to propagate these changes to clients.
// Note this is safe to do only because merging patients can only ever happen on central server.

export async function up(query) {
  const isFacility = Boolean(selectFacilityIds(config));

  if (isFacility) {
    return;
  }

  await query.sequelize.query(`
    UPDATE patients
    SET
      deleted_at = updated_at,
      updated_at_sync_tick = (SELECT CAST(value AS bigint) FROM local_system_facts WHERE key = 'currentSyncTick')
    WHERE merged_into_id IS NOT NULL AND deleted_at IS NULL
  `);
}

export async function down() {
  // destructive up, no possible down
}
