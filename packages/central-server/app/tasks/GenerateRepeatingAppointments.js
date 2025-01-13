import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class GenerateRepeatingAppointments extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.generateRepeatingTasks;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
    this.sequelize = context.store.sequelize;
  }

  getName() {
    return 'GenerateRepeatingAppointments';
  }

  async countQueue() {
    await this.sequelize.query(`
    WITH latest_appointments AS (
      SELECT schedule_id, MAX(start_time) AS latest_start_time
      FROM appointments
      GROUP BY schedule_id
    ),
    past_appointment_schedules AS (
      SELECT *
      FROM appointment_schedules
      LEFT JOIN latest_appointments ON appointment_schedules.id = latest_appointments.schedule_id
      WHERE latest_appointments.latest_start_time::date < NOW()
    )
    select * from past_appointment_schedules;
      `);
    // Get all appointmentSchedules whos appointment count is < maxOccurrences and the last appointment is in the past
    // Or the last appointment + increment is before the end date and the last appointment is in the past
    // Then count the number of appointments that need to be generated for each schedule and return the total
  }

  async run() {}
}
