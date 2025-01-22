import { APPOINTMENT_STATUSES, REPEAT_FREQUENCY } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { GenerateRepeatingAppointments } from '../../app/tasks/GenerateRepeatingAppointments';

describe('GenerateRepeatingAppointments', () => {
  let ctx;
  let settings;
  let maxRepeatingAppointmentsPerGeneration;
  let task;
  let scheduleId;

  beforeAll(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
    maxRepeatingAppointmentsPerGeneration = await settings.get(
      'appointments.maxRepeatingAppointmentsPerGeneration',
    );
  });

  beforeEach(async () => {
    task = new GenerateRepeatingAppointments(ctx);
    const { Appointment } = ctx.store.models;
    const { firstAppointment } = await Appointment.createWithSchedule({
      settings,
      appointmentData: {
        status: APPOINTMENT_STATUSES.CONFIRMED,
        startTime: '1990-10-02 12:00:00',
        endTime: '1990-10-02 13:00:00',
      },
      scheduleData: {
        occurrenceCount: maxRepeatingAppointmentsPerGeneration * 3 + 2,
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      },
    });
    scheduleId = firstAppointment.scheduleId;
  });

  afterAll(async () => {
    await ctx.close();
  });

  const expectAppointmentsGenerated = async ({ count, isFullyGenerated = false }) => {
    const { Appointment, AppointmentSchedule } = ctx.store.models;
    expect(
      await Appointment.count({
        where: { scheduleId: scheduleId },
      }),
    ).toBe(count);
    expect((await AppointmentSchedule.findByPk(scheduleId)).isFullyGenerated).toBe(
      isFullyGenerated,
    );
  };

  it('should generate repeating appointments twice including initial generation with a single task run', async () => {
    await task.run();
    await expectAppointmentsGenerated({ count: maxRepeatingAppointmentsPerGeneration * 2 });
  });
  it('should generate repeating appointments thrice including initial generation with two task runs', async () => {
    await task.run();
    await task.run();
    await expectAppointmentsGenerated({ count: maxRepeatingAppointmentsPerGeneration * 3 });
  });
  it('should fully generate appointments in schedule with three task runs and stop at occurrence count', async () => {
    await task.run();
    await task.run();
    await task.run();
    await expectAppointmentsGenerated({
      count: maxRepeatingAppointmentsPerGeneration * 3 + 2,
      isFullyGenerated: true,
    });
  });
});
