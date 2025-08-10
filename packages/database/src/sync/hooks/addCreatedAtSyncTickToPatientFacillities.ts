import { QueryTypes } from 'sequelize';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { PatientFacility } from 'models';

/**
 * Sync hook for patient facilities that sets created_at_sync_tick when it is null
 * to the current sync tick from local system facts.
 * 
 * This hook runs during facility -> central sync and ensures that patient facility
 * records have a proper created_at_sync_tick value for tracking when they were
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
  const relevantChanges = changes.filter(
    (c) => !c.isDeleted && c.data.createdAtSyncTick === null,
  );

  if (relevantChanges.length === 0) {
    return;
  }

  // Get current sync tick from local system facts
  const currentSyncTick = await PatientFacilityModel.sequelize.query(
    `SELECT value FROM local_system_facts WHERE key = 'currentSyncTick'`,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (!currentSyncTick || currentSyncTick.length === 0) {
    return;
  }

  const tick = parseInt((currentSyncTick[0] as { value: string }).value, 10);

  // Update the changes to set created_at_sync_tick
  const updatedChanges = relevantChanges.map((change) => ({
    ...change,
    data: {
      ...change.data,
      createdAtSyncTick: tick,
    },
  }));

  return {
    inserts: [],
    updates: updatedChanges,
  };
};
