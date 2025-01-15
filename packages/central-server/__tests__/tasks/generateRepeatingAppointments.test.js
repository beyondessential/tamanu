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
    const schedule = await ctx.store.models.AppointmentSchedule.create({
      startDate: '2024-10-02 12:00:00',
      untilDate: '2024-10-10 12:00:00',
      interval: 1,
      frequency: REPEAT_FREQUENCY.WEEKLY,
      daysOfWeek: ['WE'],
    });
    await ctx.store.models.Appointment.create(
      fake(ctx.store.models.Appointment, {
        scheduleId: schedule.id,
        startTime: '2024-10-02 12:00:00',
      }),
    );
    const task = new GenerateRepeatingAppointments(ctx);
    await task.run();
    expect(true).toBe(true);
  });
});
