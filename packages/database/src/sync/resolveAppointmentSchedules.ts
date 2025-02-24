import { QueryTypes } from 'sequelize';
import { keyBy, mapValues } from 'lodash';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import type { Appointment, AppointmentSchedule } from 'models';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import { SYNC_SESSION_DIRECTION } from './constants';
import { sanitizeRecord } from './sanitizeRecord';

/**
 * The new changes will be persisted in the sync_snapshot table
 * @param AppointmentModel
 * @param changes
 */
export const resolveAppointmentSchedules = async (
  AppointmentScheduleModel: typeof AppointmentSchedule,
  changes: SyncSnapshotAttributes[],
): Promise<SyncHookSnapshotChanges | undefined> => {
  const relevantChanges = changes.filter((c) => !c.isDeleted && c.data.cancelledAtDate);

  if (relevantChanges.length === 0) {
    return;
  }

  const generatedUntilDates = mapValues(
    keyBy(relevantChanges, 'data.id'),
    'data.generatedUntilDate',
  );

  const outOfBoundAppointments = (await AppointmentScheduleModel.sequelize.query(
    `
    WITH schedule_generated_until_dates AS (
     select value as date, key as id from json_each(:generatedUntilDates)
    )
    SELECT
      *
    FROM
      appointments
    WHERE
      schedule_id IN (:scheduleIds)
      AND status <> :canceledStatus
    AND
      start_time > (SELECT date::date_string FROM schedule_generated_until_dates WHERE id::uuid = schedule_id)
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
        scheduleIds: Object.keys(generatedUntilDates),
        generatedUntilDates: JSON.stringify(generatedUntilDates),
      },
    },
  )) as Appointment[];

  if (outOfBoundAppointments.length === 0) {
    return;
  }

  const inserts = outOfBoundAppointments.map((a) => ({
    direction: SYNC_SESSION_DIRECTION.INCOMING,
    recordType: 'appointments',
    recordId: a.id,
    isDeleted: true,
    data: sanitizeRecord(a),
  }));

  return {
    inserts,
    updates: [],
  };
};
