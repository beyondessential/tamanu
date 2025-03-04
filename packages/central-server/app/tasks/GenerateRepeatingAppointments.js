import config from 'config';
import { QueryTypes } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';

export class GenerateRepeatingAppointments extends ScheduledTask {
  /**
   *
   * @param {import('../ApplicationContext').ApplicationContext} context
   */
  constructor(context) {
    const conf = config.schedules.generateRepeatingAppointments;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.models = context.store.models;
    this.config = conf;
    this.sequelize = context.store.sequelize;
    this.settings = context.settings;
  }

  getName() {
    return 'GenerateRepeatingAppointments';
  }

  async run() {
    // Find all schedules that are incomplete and have a latest appointment that is older than the offset days
    const schedules = await this.sequelize.query(
      `
      SELECT
          appointment_schedules.*,
          latest_appointment.start_time AS latest_appointment_start_time
        FROM appointment_schedules
        LEFT JOIN LATERAL (
          SELECT start_time
          FROM appointments
          WHERE appointments.schedule_id = appointment_schedules.id AND appointments.status <> :canceledStatus
          ORDER BY appointments.start_time DESC
          LIMIT 1
        ) AS latest_appointment ON true
        WHERE appointment_schedules.deleted_at IS NULL
        AND appointment_schedules.cancelled_at_date IS NULL
        AND appointment_schedules.is_fully_generated = false
        AND latest_appointment.start_time::date < NOW() + INTERVAL :offsetDays DAY
      `,
      {
        type: QueryTypes.SELECT,
        model: this.models.AppointmentSchedule,
        mapToModel: true,
        replacements: {
          offsetDays: `${this.config.generateOffsetDays}`,
          canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
        },
      },
    );
    if (!schedules.length) {
      this.log.info('No incomplete schedules found within time frame');
      return;
    }
    this.log.info('Found incomplete schedules within time frame', {
      count: schedules.length,
    });

    await this.sequelize.transaction(() =>
      Promise.all(
        schedules.map(async (schedule) => {
          const appointments = await schedule.generateRepeatingAppointment(this.settings);
          this.log.info('Generated appointments for schedule', {
            count: appointments.length,
            scheduleId: schedule.id,
          });
        }),
      ),
    );
  }
}
