import { keyBy, mapValues } from 'es-toolkit/compat';
import { QueryTypes } from 'sequelize';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { Appointment, AppointmentSchedule } from '../models';
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
  const relevantChanges = changes.filter(c => !c.isDeleted && c.data.cancelledAtDate);

  if (relevantChanges.length === 0) {
    return;
  }

  // Map of incoming generatedUntilDates for each schedule
  const generatedUntilDates = mapValues(
    keyBy(relevantChanges, 'data.id'),
    'data.generatedUntilDate',
  );

  // Select only the model's own columns and map them onto the Appointment model so the snapshot
  // data has camel case keys. A raw `SELECT *` row would carry `deleted_at`, but `sanitizeRecord`
  // expects (and strips) `deletedAt`; it would also carry legacy columns the model no longer
  // declares, which `mapToModel` passes through under their raw names.
  const { Appointment: AppointmentModel } = AppointmentScheduleModel.sequelize.models;
  /**
   * Get attributes from Sequelize model, because `SELECT *` includes `start_time_legacy` and
   * `end_time_legacy`, which we don’t want.
   */
  const appointmentColumns = Object.values(AppointmentModel.getAttributes())
    .map(attribute => `appointments.${attribute.field}`)
    .join(', ');
  const outOfBoundAppointments = await AppointmentScheduleModel.sequelize.query(
    `
    WITH schedule_generated_until_dates AS (
     SELECT value::date_string AS date, key::uuid AS id from json_each_text(:generatedUntilDates)
    )
    SELECT
      ${appointmentColumns}
    FROM
      appointments
    WHERE
      schedule_id IN (:scheduleIds)
      AND status <> :canceledStatus
    AND
      start_time::date_string > (SELECT date FROM schedule_generated_until_dates WHERE id = schedule_id)
    `,
    {
      type: QueryTypes.SELECT,
      model: AppointmentModel as typeof Appointment,
      mapToModel: true,
      replacements: {
        canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
        scheduleIds: Object.keys(generatedUntilDates),
        generatedUntilDates: JSON.stringify(generatedUntilDates),
      },
    },
  );

  if (outOfBoundAppointments.length === 0) {
    return;
  }

  const inserts = outOfBoundAppointments.map(a => ({
    direction: SYNC_SESSION_DIRECTION.INCOMING,
    recordType: 'appointments',
    recordId: a.id,
    isDeleted: true,
    data: sanitizeRecord(a.get({ plain: true })),
  }));

  return {
    inserts,
    updates: [],
  };
};
