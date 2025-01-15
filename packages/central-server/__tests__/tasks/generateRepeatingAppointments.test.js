import config from 'config';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { GenerateRepeatingAppointments } from '../../app/tasks/GenerateRepeatingAppointments';
import { REPEAT_FREQUENCY } from '@tamanu/constants';

describe('GenerateRepeatingAppointments', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('should generate repeating appointments', async () => {
    const { maxInitialRepeatingAppointments } = config.appointments;
    const { Appointment } = ctx.store.models;
    const [appointment] = await Appointment.createWithSchedule(
      fake(ctx.store.models.Appointment, {
        startTime: '2020-10-02 12:00:00',
        endTime: '2020-10-02 13:00:00',
      }),
      {
        startDate: '2020-10-02 12:00:00',
        occurrenceCount: maxInitialRepeatingAppointments * 2,
        interval: 1,
        frequency: REPEAT_FREQUENCY.WEEKLY,
        daysOfWeek: ['WE'],
      },
    );

    expect(
      await Appointment.count({
        where: { scheduleId: appointment.scheduleId },
      }),
    ).toBe(maxInitialRepeatingAppointments);

    const task = new GenerateRepeatingAppointments(ctx);
    await task.run();
    expect(
      await Appointment.count({
        where: { scheduleId: appointment.scheduleId },
      }),
    ).toBe(maxInitialRepeatingAppointments * 2);
  });
});
