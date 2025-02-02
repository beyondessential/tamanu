import { Op } from 'sequelize';
import { keyBy } from 'lodash';
import { isAfter, parseISO } from 'date-fns';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

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
  const appointmentScheduleIds = [
    ...new Set(
      changes
        .filter(
          (c) =>
            !c.isDeleted && c.data.scheduleId && c.data.status !== APPOINTMENT_STATUSES.CANCELLED,
        )
        .map((c) => c.data.scheduleId),
    ),
  ];

  console.log('appointmentScheduleIds', appointmentScheduleIds);
  if (appointmentScheduleIds.length === 0) {
    return;
  }

  const existingAppointmentsWithSchedules =
    await AppointmentModel.sequelize.models.AppointmentSchedule.findAll({
      where: {
        id: { [Op.in]: appointmentScheduleIds },
        untilDate: {
          [Op.not]: null,
        },
        isFullyGenerated: true,
      },
    });

  if (existingAppointmentsWithSchedules.length === 0) {
    return;
  }

  const keyedSchedules = keyBy(existingAppointmentsWithSchedules, 'id');

  const appointmentsToDelete = changes.filter((c) =>
    isAfter(
      parseISO(c.data.startTime),
      parseISO(keyedSchedules[c.data.scheduleId]!.untilDate as string),
    ),
  );

  return {
    inserts: [],
    updates: [],
    deletes: appointmentsToDelete,
  };
};
