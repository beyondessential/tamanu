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
      ),
      schedules_not_completed AS (
        SELECT *
        FROM past_appointment_schedules
        WHERE (occurrence_count IS NULL AND until_date > latest_start_time) OR (occurrence_count > (
            SELECT COUNT(*)
            FROM appointments
            WHERE schedule_id = past_appointment_schedules.id
          )
        )
      )
      select * from schedules_not_completed;
    `);
    // We gotta problem where by we can't easily check next tues or wateva for until_date variation so maybe we just do in js with date-fns
  }

  async run() {}
}
