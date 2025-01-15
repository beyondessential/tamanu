import config from 'config';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { GenerateRepeatingAppointments } from '../../app/tasks/GenerateRepeatingAppointments';
import { APPOINTMENT_STATUSES, REPEAT_FREQUENCY } from '@tamanu/constants';

describe('GenerateRepeatingAppointments', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('should generate repeating appointments for large occurrence count across multiple runs', async () => {
    const { maxInitialRepeatingAppointments } = config.appointments;
    const { Appointment, AppointmentSchedule } = ctx.store.models;
    const [appointment] = await Appointment.createWithSchedule(
      {
        status: APPOINTMENT_STATUSES.CONFIRMED,
        startTime: '1990-10-02 12:00:00',
        endTime: '1990-10-02 13:00:00',
      },
      {
        startDate: '1990-10-02 12:00:00',
        occurrenceCount: maxInitialRepeatingAppointments * 3 + 2,
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      },
    );

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

    // Should hit the limit of maxInitialRepeatingAppointments
    await testStep(maxInitialRepeatingAppointments);
    await task.run();
    // Should generate another set of appointments and hit the limit of maxInitialRepeatingAppointments
    await testStep(maxInitialRepeatingAppointments * 2);
    await task.run();
    // Should generate another set of appointments and hit the limit of maxInitialRepeatingAppointments
    await testStep(maxInitialRepeatingAppointments * 3);
    await task.run();
    // Should complete generation of repeating appointments
    await testStep(maxInitialRepeatingAppointments * 3 + 2, true);
  });
});
