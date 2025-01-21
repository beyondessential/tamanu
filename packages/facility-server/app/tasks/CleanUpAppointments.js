import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { InvalidConfigError } from '@tamanu/shared/errors';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

export class CleanUpAppointments extends ScheduledTask {
  getName() {
    return 'CleanUpAppointments';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = config.schedules.cleanUpAppointments;
    super(schedule, log, jitterTime, enabled);
    this.config = config.schedules.cleanUpAppointments;
    this.sequelize = context.sequelize;
    this.models = context.models;
    this.runImmediately();
  }

  async countQueue() {
    const { count } = await this.sequelize.query(
      `SELECT COUNT(*)
       FROM appointments
       JOIN appointment_schedules ON appointments.schedule_id = appointment_schedules.id
       WHERE appointments.status <> :canceledStatus AND appointments.start_time > appointment_schedules.until_date;`,
      {
        plain: true,
        type: this.sequelize.QueryTypes.SELECT,
        replacements: {
          canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
        },
      },
    );
    return Number(count);
  }

  async cancelAppointments() {
    await this.sequelize.query(
      `
      WITH appointments_to_cancel AS (
        SELECT appointments.id
        FROM appointments
        JOIN appointment_schedules ON appointments.schedule_id = appointment_schedules.id
        WHERE appointments.status <> :canceledStatus AND appointments.start_time > appointment_schedules.until_date
        ORDER BY appointments.start_time
        FOR UPDATE
        LIMIT :batchSize
      )
      UPDATE appointments
      SET status = :canceledStatus
      FROM appointments_to_cancel
      WHERE appointments.id = appointments_to_cancel.id;
      `,
      {
        replacements: {
          canceledStatus: APPOINTMENT_STATUSES.CANCELLED,
          batchSize: this.config.batchSize,
        },
      },
    );
  }

  async run() {
    const toProcess = await this.countQueue();
    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    // Make sure these exist, else they will prevent the script from working
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for Clean up appointments',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Cancelling appointments', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });
    for (let i = 0; i < batchCount; i++) {
      await this.cancelAppointments();
      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
