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

  // Get current sync tick from local system facts
  console.log(relevantChanges);
  const [currentSyncTick] = await PatientFacilityModel.sequelize.query(
    `SELECT local_system_fact(${FACT_CURRENT_SYNC_TICK}) as currentSyncTicik`,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (!currentSyncTick) {
    return;
  }
  // Update the changes to set created_at_sync_tick
  const updatedChanges = relevantChanges.map(change => ({
    ...change,
    data: {
      ...change.data,
      createdAtSyncTick: currentSyncTick,
    },
  }));

  return {
    inserts: [],
    updates: updatedChanges,
  };
};
