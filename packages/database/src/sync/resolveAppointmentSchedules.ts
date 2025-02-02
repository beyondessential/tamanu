import { QueryTypes } from 'sequelize';
import { keyBy, mapValues } from 'lodash';
// import { isAfter, parseISO } from 'date-fns';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import type { AppointmentSchedule } from 'models';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';

// /**
//  * The new changes will be persisted in the sync_snapshot table
//  * @param AppointmentModel
//  * @param changes
//  */
// export const resolveAppointmentSchedules = async (
//   AppointmentModel: typeof Appointment,
//   changes: SyncSnapshotAttributes[],
// ): Promise<SyncHookSnapshotChanges | undefined> => {
//   const relevantChanges = changes.filter(
//     (c) => !c.isDeleted && c.data.scheduleId && c.data.status !== APPOINTMENT_STATUSES.CANCELLED,
//   );
//   const appointmentScheduleIds = [...new Set(relevantChanges.map((c) => c.data.scheduleId))];

//   console.log('appointmentScheduleIds', appointmentScheduleIds);
//   if (appointmentScheduleIds.length === 0) {
//     return;
//   }

//   const existingAppointmentsWithSchedules =
//     await AppointmentModel.sequelize.models.AppointmentSchedule.findAll({
//       where: {
//         id: { [Op.in]: appointmentScheduleIds },
//         untilDate: {
//           [Op.not]: null,
//         },
//         isFullyGenerated: true,
//       },
//     });

//   if (existingAppointmentsWithSchedules.length === 0) {
//     return;
//   }

//   const keyedSchedules = keyBy(existingAppointmentsWithSchedules, 'id');

//   const appointmentsToDelete = relevantChanges.filter((c) =>
//     isAfter(
//       parseISO(c.data.startTime),
//       parseISO(keyedSchedules[c.data.scheduleId]!.untilDate as string),
//     ),
//   );

//   return {
//     inserts: changes.filter(
//       (c) => !c.isDeleted && !appointmentsToDelete.some((d) => d.data.id === c.data.id),
//     ),
//     updates: [],
//     deletes: appointmentsToDelete,
//   };
// };

/**
//  * The new changes will be persisted in the sync_snapshot table
//  * @param AppointmentModel
//  * @param changes
//  */
export const resolveAppointmentSchedules = async (
  AppointmentScheduleModel: typeof AppointmentSchedule,
  changes: SyncSnapshotAttributes[],
): Promise<SyncHookSnapshotChanges | undefined> => {
  const relevantChanges = changes.filter(
    (c) => !c.isDeleted && c.data.untilDate && c.data.isFullyGenerated,
  );

  console.log('appointmentScheduleIds', relevantChanges);
  if (relevantChanges.length === 0) {
    return;
  }

  console.log('relevantChanges', relevantChanges);
  const keyedByScheduleId = mapValues(keyBy(relevantChanges, 'data.id'), 'data.untilDate');

  console.log('keyedByScheduleId', keyedByScheduleId);
  const existingAppointmentsWithSchedules = await AppointmentScheduleModel.sequelize.query(
    `
    WITH schedule_end_dates AS (
     select value as date, key as id from json_each(:keyedByScheduleId)
    )
    SELECT
      *
    FROM
      appointments
    WHERE
      schedule_id IN (:scheduleIds)
      AND status <> :canceledStatus
    AND
      start_time > (SELECT date FROM schedule_end_dates WHERE id = schedule_id)
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
        scheduleIds: Object.keys(keyedByScheduleId),
        keyedByScheduleId: JSON.stringify(keyedByScheduleId),
      },
    },
  );

  if (existingAppointmentsWithSchedules.length === 0) {
    return;
  }
  console.log('existingAppointmentsWithSchedules', existingAppointmentsWithSchedules);
  return;
  // const keyedSchedules = keyBy(existingAppointmentsWithSchedules, 'id');

  // const appointmentsToDelete = relevantChanges.filter((c) =>
  //   isAfter(
  //     parseISO(c.data.startTime),
  //     parseISO(keyedSchedules[c.data.scheduleId]!.untilDate as string),
  //   ),
  // );

  // return {
  //   inserts: changes.filter(
  //     (c) => !c.isDeleted && !appointmentsToDelete.some((d) => d.data.id === c.data.id),
  //   ),
  //   updates: [],
  //   deletes: appointmentsToDelete,
  // };
};
