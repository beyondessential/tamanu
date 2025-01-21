import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';

export class CleanUpAppointments extends ScheduledTask {
  getName() {
    return 'CleanUpAppointments';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = config.schedules.cleanUpAppointments;
    super(schedule, log, jitterTime, enabled);
    this.sequelize = context.sequelize;
    this.models = context.models;
    this.runImmediately();
  }

  async countQueue() {
    return this.sequelize.query(
      `SELECT COUNT(*)
       FROM appointments
       JOIN appointment_schedules ON appointments.schedule_id = appointment_schedules.id
       WHERE appointments.status <> :canceledStatus AND appointments.start_time < appointment_schedules.until_date;`,
      {
        plain: true,
        type: this.sequelize.QueryTypes.SELECT,
        replacements: {
          canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
        },
      },
    );
  }

  async run() {}
}
