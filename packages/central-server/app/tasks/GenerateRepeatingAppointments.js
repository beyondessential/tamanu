import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { QueryTypes } from 'sequelize';

const OFFSET_DAYS = 7;

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
    // TODO introduce an offset so new appointments are created say a few weeks before they are due

    const schedules = await this.sequelize.query(
      `
      SELECT
          appointment_schedules.*,
          latest_appointment.start_time AS latest_appointment_start_time
        FROM appointment_schedules
        LEFT JOIN LATERAL (
          SELECT start_time
          FROM appointments
          WHERE appointments.schedule_id = appointment_schedules.id
          ORDER BY appointments.start_time DESC
          LIMIT 1
        ) AS latest_appointment ON true
        WHERE latest_appointment.start_time::date < NOW() - INTERVAL :offsetDays DAY
        AND appointment_schedules.is_fully_generated = false
      `,
      {
        type: QueryTypes.SELECT,
        model: this.models.AppointmentSchedule,
        mapToModel: true,
        replacements: { offsetDays: String(OFFSET_DAYS) },
      },
    );
    this.log.info('Found incomplete schedules to generate appointments for', {
      count: schedules.length,
    });

    await Promise.all(
      schedules.map(async (schedule) => {
        const appointments = await schedule.generateRepeatingAppointment();
        this.log.info('Generated appointments for schedule', {
          count: appointments.length,
          scheduleId: schedule.id,
        });
      }),
    );
  }
}
