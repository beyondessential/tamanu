import type { Appointment } from 'models';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';

/**
 * The new changes will be persisted in the sync_snapshot table
 * @param AppointmentModel
 * @param changes
 */
export const resolveAppointmentSchedules = async (
  AppointmentModel: typeof Appointment,
  changes: SyncSnapshotAttributes[],
): Promise<SyncHookSnapshotChanges | undefined> => {
  // When syncing down to facility server
  // Incoming appointments associated with schedules
  // where appointment.startTime > schedule.untilDate
  // If so delete the appointment

  return {
    inserts: [],
    updates: [],
    deletes: [],
  };
};
