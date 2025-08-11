import { QueryTypes } from 'sequelize';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { PatientFacility } from 'models';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

/**
 * Ensures that patient facility records have a proper created_at_sync_tick value for tracking when they were
 * first marked for sync.
 *
 * @param PatientFacilityModel - The PatientFacility model
 * @param changes - Array of sync snapshot attributes for patient facilities
 * @returns Promise<SyncHookSnapshotChanges | undefined>
 */
export const addCreatedAtSyncTickToPatientFacilities = async (
  PatientFacilityModel: typeof PatientFacility,
  changes: SyncSnapshotAttributes[],
): Promise<SyncHookSnapshotChanges | undefined> => {
  const relevantChanges = changes.filter(c => !c.isDeleted && c.data.createdAtSyncTick === null);

  if (relevantChanges.length === 0) {
    return;
  }

  const result = (await PatientFacilityModel.sequelize.query(
    `SELECT local_system_fact('${FACT_CURRENT_SYNC_TICK}', '0') as "currentSyncTick"`,
    {
      type: QueryTypes.SELECT,
    },
  )) as { currentSyncTick: string }[];

  if (!result || result.length === 0 || !result[0]?.currentSyncTick) {
    return;
  }

  const tick = result[0].currentSyncTick;

  const changesWithCreatedAtSyncTick = relevantChanges.map(change => {
    change.data.createdAtSyncTick = tick;
    return change;
  });

  return {
    inserts: changesWithCreatedAtSyncTick,
    updates: [],
  };
};
