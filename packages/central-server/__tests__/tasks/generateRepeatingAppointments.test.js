import { APPOINTMENT_STATUSES, REPEAT_FREQUENCY } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { GenerateRepeatingAppointments } from '../../app/tasks/GenerateRepeatingAppointments';

describe('GenerateRepeatingAppointments', () => {
  let ctx;
  let settings;

  beforeAll(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('should generate repeating appointments for large occurrence count across multiple runs', async () => {
    const maxRepeatingAppointmentsPerGeneration = await settings.get(
      'appointments.maxRepeatingAppointmentsPerGeneration',
    );
    const { Appointment, AppointmentSchedule } = ctx.store.models;
    const [appointment] = await Appointment.createWithSchedule({
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

    const task = new GenerateRepeatingAppointments(ctx);
    const testStep = async (expectedCount, expectedIsFullyGenerated = false) => {
      expect(
        await Appointment.count({
          where: { scheduleId: appointment.scheduleId },
        }),
      ).toBe(expectedCount);
      expect((await AppointmentSchedule.findByPk(appointment.scheduleId)).isFullyGenerated).toBe(
        expectedIsFullyGenerated,
      );
    };

    // Should hit the limit of maxRepeatingAppointmentsPerGeneration
    await testStep(maxRepeatingAppointmentsPerGeneration);
    await task.run();
    // Should generate another set of appointments and hit the limit of maxRepeatingAppointmentsPerGeneration
    await testStep(maxRepeatingAppointmentsPerGeneration * 2);
    await task.run();
    // Should generate another set of appointments and hit the limit of maxRepeatingAppointmentsPerGeneration
    await testStep(maxRepeatingAppointmentsPerGeneration * 3);
    await task.run();
    // Should complete generation of repeating appointments
    await testStep(maxRepeatingAppointmentsPerGeneration * 3 + 2, true);
  });
});
