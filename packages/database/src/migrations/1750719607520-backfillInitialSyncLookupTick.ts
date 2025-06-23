import config from 'config';
import { QueryInterface, QueryTypes } from 'sequelize';

import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

export async function up(query: QueryInterface): Promise<void> {
  const isFacility = Boolean(selectFacilityIds(config));

  if (isFacility) {
    return;
  }

  const [{ hasInitialSyncLookupTick }] = (await query.sequelize.query<{
    hasInitialSyncLookupTick: boolean;
  }>(
    `SELECT COUNT(*) > 0 as "hasInitialSyncLookupTick" FROM sync_lookup_ticks WHERE source_start_tick = -1`,
    {
      type: QueryTypes.SELECT,
    },
  )) as [{ hasInitialSyncLookupTick: boolean }];

  const [{ lookupTableIsEmpty }] = (await query.sequelize.query(
    `SELECT COUNT(*) = 0 as "lookupTableIsEmpty" FROM sync_lookup`,
    {
      type: QueryTypes.SELECT,
    },
  )) as [{ lookupTableIsEmpty: boolean }];

  // If the sync_lookup table is empty
  // the initial sync_lookup_tick will be created with a source_start_tick of -1 at time of initial sync.
  if (hasInitialSyncLookupTick || lookupTableIsEmpty) {
    return;
  }

  // Insert a backfilled initial sync lookup tick with a source_start_tick of -1
  // and a lookup_end_tick equal to the highest updated_at_sync_tick of any sync_lookup record with a
  // updated_at_sync_tick less than the minimum lookup_end_tick.
  // If no sync_lookup_ticks exist we use the max updated_at_sync_tick of the sync_lookup table.
  // This will ensure that the initial sync_lookup_tick is set to the correct value.
  await query.sequelize.query(`
    INSERT INTO sync_lookup_ticks (source_start_tick, lookup_end_tick)
    SELECT -1,
      COALESCE(
        (
          SELECT MAX(updated_at_sync_tick)
          FROM sync_lookup 
          WHERE updated_at_sync_tick < (
            SELECT MIN(lookup_end_tick)
            FROM sync_lookup_ticks
          )
        ),
        (
          SELECT MAX(updated_at_sync_tick) 
          FROM sync_lookup
        )
      );
  `);
}

export async function down(_query: QueryInterface): Promise<void> {
  // Do nothing
}
