import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { APPOINTMENT_STATUSES, REPEAT_FREQUENCY } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { COLUMNS_EXCLUDED_FROM_SYNC, SYNC_SESSION_DIRECTION } from '../../src/sync/constants';
import { resolveAppointmentSchedules } from '../../src/sync/resolveAppointmentSchedules';
import { closeDatabase, createTestDatabase } from '../utilities';

describe('resolveAppointmentSchedules', () => {
  let models;
  let patient;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;
    patient = await models.Patient.create(fake(models.Patient));
  });

  afterEach(async () => {
    await models.Appointment.destroy({ where: {}, force: true });
    await models.AppointmentSchedule.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const createSchedule = async () =>
    models.AppointmentSchedule.create({
      ...fake(models.AppointmentSchedule),
      interval: 1,
      frequency: REPEAT_FREQUENCY.WEEKLY,
      daysOfWeek: ['WE'],
      untilDate: '1990-10-23',
      generatedUntilDate: '1990-10-23',
      // fake() fills every date column, so pin the one the resolver keys off
      cancelledAtDate: null,
      isFullyGenerated: true,
    });

  const createAppointment = (schedule, date, status = APPOINTMENT_STATUSES.CONFIRMED) =>
    models.Appointment.create({
      startTime: `${date} 12:00:00`,
      endTime: `${date} 13:00:00`,
      status,
      patientId: patient.id,
      scheduleId: schedule.id,
    });

  // the facility cancels the schedule while only aware of appointments up to generatedUntilDate
  const cancelledScheduleChange = schedule => ({
    direction: SYNC_SESSION_DIRECTION.OUTGOING,
    isDeleted: false,
    recordType: 'appointment_schedules',
    recordId: schedule.id,
    data: {
      ...schedule.get({ plain: true }),
      generatedUntilDate: '1990-10-09',
      cancelledAtDate: '1990-10-02',
    },
  });

  it('marks appointments generated past the cancelled schedule’s generatedUntilDate for deletion', async () => {
    const schedule = await createSchedule();
    await createAppointment(schedule, '1990-10-09');
    const outOfBound1 = await createAppointment(schedule, '1990-10-16');
    const outOfBound2 = await createAppointment(schedule, '1990-10-23');

    const result = await resolveAppointmentSchedules(models.AppointmentSchedule, [
      cancelledScheduleChange(schedule),
    ]);

    expect(result.updates).toEqual([]);
    expect(result.inserts).toHaveLength(2);
    expect(result.inserts.map(i => i.recordId).sort()).toEqual(
      [outOfBound1.id, outOfBound2.id].sort(),
    );
    for (const insert of result.inserts) {
      expect(insert).toMatchObject({
        direction: SYNC_SESSION_DIRECTION.INCOMING,
        recordType: 'appointments',
        isDeleted: true,
      });
      expect(insert.data.id).toBe(insert.recordId);
    }
  });

  it('emits model-shaped snapshot data with sync metadata columns stripped', async () => {
    // A raw `SELECT *` row would carry `deleted_at: null`, which the persist step then writes in the
    // same UPDATE as `deletedAt: now()`, and the raw key wins — so the delete is silently lost.
    const schedule = await createSchedule();
    await createAppointment(schedule, '1990-10-16');

    const { inserts } = await resolveAppointmentSchedules(models.AppointmentSchedule, [
      cancelledScheduleChange(schedule),
    ]);

    expect(inserts).toHaveLength(1);
    const { data } = inserts[0];
    // exactly the model's attributes minus sync metadata — the same set the sync lookup builds —
    // so no raw column name (`deleted_at`, undeclared legacy columns) can leak through
    const syncedAttributes = Object.keys(models.Appointment.getAttributes()).filter(
      attribute => !COLUMNS_EXCLUDED_FROM_SYNC.includes(attribute),
    );
    expect(Object.keys(data).sort()).toEqual(syncedAttributes.sort());
    expect(data).toMatchObject({
      scheduleId: schedule.id,
      patientId: patient.id,
      startTime: '1990-10-16 12:00:00',
      status: APPOINTMENT_STATUSES.CONFIRMED,
    });
  });

  it('ignores appointments that are already cancelled', async () => {
    const schedule = await createSchedule();
    await createAppointment(schedule, '1990-10-16', APPOINTMENT_STATUSES.CANCELLED);
    const stillActive = await createAppointment(schedule, '1990-10-23');

    const { inserts } = await resolveAppointmentSchedules(models.AppointmentSchedule, [
      cancelledScheduleChange(schedule),
    ]);

    expect(inserts.map(i => i.recordId)).toEqual([stillActive.id]);
  });

  it('returns nothing when no change carries a cancelledAtDate', async () => {
    const schedule = await createSchedule();
    await createAppointment(schedule, '1990-10-16');

    const result = await resolveAppointmentSchedules(models.AppointmentSchedule, [
      {
        ...cancelledScheduleChange(schedule),
        data: { ...schedule.get({ plain: true }), generatedUntilDate: '1990-10-09' },
      },
    ]);

    expect(result).toBeUndefined();
  });

  it('returns nothing when every appointment is within the generated bounds', async () => {
    const schedule = await createSchedule();
    await createAppointment(schedule, '1990-10-02');
    await createAppointment(schedule, '1990-10-09');

    const result = await resolveAppointmentSchedules(models.AppointmentSchedule, [
      cancelledScheduleChange(schedule),
    ]);

    expect(result).toBeUndefined();
  });
});
