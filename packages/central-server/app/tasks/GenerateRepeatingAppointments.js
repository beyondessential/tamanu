import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { QueryTypes } from 'sequelize';

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
      SELECT appointment_schedules.*,
              latest_appointment.start_time as "appointment.start_time",
              latest_appointment.end_time as "appointment.end_time",
              latest_appointment.clinician_id as "appointment.clinician_id",
              latest_appointment.location_group_id as "appointment.location_group_id",
              latest_appointment.appointment_type_id as "appointment.appointment_type_id",
              latest_appointment.patient_id as "appointment.patient_id",
              latest_appointment.is_high_priority as "appointment.is_high_priority",
              latest_appointment.schedule_id as "appointment.schedule_id",
              latest_appointment.status as "appointment.status"
      FROM appointment_schedules
          JOIN LATERAL (
            SELECT * FROM appointments
            WHERE appointments.schedule_id = appointment_schedules.id
            ORDER BY appointments.start_time DESC
            LIMIT 1
          ) AS latest_appointment ON true
          WHERE latest_appointment.start_time::date < NOW() and appointment_schedules.is_fully_generated = false
      `,
      { type: QueryTypes.SELECT, nest: true },
    );

    for (const schedule of schedules) {
      const { appointment, ...scheduleData } = schedule;
    }

    // We gotta problem where by we can't easily check next tues or
    // 3rd tues in month for until_date variation so maybe we just do in js with date-fns
  }
}
