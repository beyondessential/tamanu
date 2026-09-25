import { keyBy, mapValues } from 'es-toolkit/compat';
import { literal, Op } from 'sequelize';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import type { SyncHookSnapshotChanges, SyncSnapshotAttributes } from 'types/sync';
import type { AppointmentSchedule } from '../models';
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

  // A model query selects only the declared attributes, under their camel case names, so the
  // snapshot data can't carry a raw column name (`deleted_at`, undeclared legacy columns) into the
  // persist step, where it would be written to the SET clause as-is.
  const { sequelize } = AppointmentScheduleModel;
  const outOfBoundAppointments = await sequelize.models.Appointment.findAll({
    where: {
      scheduleId: { [Op.in]: Object.keys(generatedUntilDates) },
      status: { [Op.ne]: APPOINTMENT_STATUSES.CANCELLED },
      [Op.and]: literal(
        `start_time::date_string > (
          SELECT value::date_string
          FROM json_each_text(${sequelize.escape(JSON.stringify(generatedUntilDates))})
          WHERE key::uuid = schedule_id
        )`,
      ),
    },
    raw: true,
  });

  if (outOfBoundAppointments.length === 0) {
    return;
  }

  const inserts = outOfBoundAppointments.map(a => ({
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
