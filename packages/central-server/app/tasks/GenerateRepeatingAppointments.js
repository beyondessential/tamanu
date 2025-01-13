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

  async run() {
    await this.sequelize.query(
      `
      WITH schedules_with_latest_appointment_in_past AS (
          SELECT * FROM appointment_schedules
          JOIN LATERAL (
            SELECT start_time FROM appointments
            WHERE appointments.schedule_id = appointment_schedules.id
            ORDER BY appointments.start_time DESC
            LIMIT 1
          ) AS latest_appointment ON true
          WHERE latest_appointment.start_time::date < NOW()
        ),
      possible_incomplete_schedules AS (
        SELECT *
        FROM past_appointment_schedules
        WHERE (occurrence_count IS NULL AND until_date > start_time) OR (occurrence_count > (
            SELECT COUNT(*)
            FROM appointments
            WHERE schedule_id = past_appointment_schedules.id
          )
        )
      )
      select * from possible_incomplete_schedules;
    `,
      { type: this.sequelize.QueryTypes.SELECT },
    );
    // We gotta problem where by we can't easily check next tues or
    // 3rd tues in month for until_date variation so maybe we just do in js with date-fns
  }
}
