import { CleanUpAppointments } from '../../app/tasks/CleanUpAppointments';
import { createTestContext } from '../utilities';
import { APPOINTMENT_STATUSES, REPEAT_FREQUENCY } from '@tamanu/constants';

describe('Clean up appointments', () => {
  let context;
  let models;
  let task;
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
    task = new CleanUpAppointments(context);
  });

  it('should cancel appointments that are past the schedule until date', async () => {
    const { Appointment, AppointmentSchedule } = models;
    const schedule = await AppointmentSchedule.create({
      untilDate: '1990-10-02',
      interval: 1,
      frequency: REPEAT_FREQUENCY.WEEKLY,
      daysOfWeek: ['WE'],
    });
    await Appointment.bulkCreate(
      ['1990-10-09 12:00:00', '1990-10-16 12:00:00', '1990-10-23 12:00:00'].map((startTime) => ({
        scheduleId: schedule.id,
        status: APPOINTMENT_STATUSES.CONFIRMED,
        startTime,
      })),
    );
    await task.run();
    const appointments = await Appointment.findAll();
    expect(appointments).toHaveLength(3);
    expect(
      appointments.every((appointment) => appointment.status === APPOINTMENT_STATUSES.CANCELLED),
    );
  });
});
