import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/shared/utils';
import { InvalidConfigError } from '@tamanu/shared/errors';

export class VaccinationReminder extends ScheduledTask {
  getName() {
    return 'VaccinationReminder';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.vaccinationReminder,
      ...overrideConfig,
    };
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  async run() {
    // TODO: 
    // Grab all patients that need reminders
    // Ensure reminder is not old
    // Ensure reminder hasn't already been scheduled
    // Ensure patient has at least one patient contact

    const { Patient } = this.models;

    const query = {};

    const toProcess = 0;
    if (toProcess === 0) return;

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    // Make sure these exist, else they will prevent the script from working
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for VaccinationReminder',
      );
    }

    const batchCount = Math.ceil(toProcess / batchSize);

    log.info('Running batched timeout of patient planned moves', {
      recordCount: toProcess,
      batchCount,
      batchSize,
    });

    for (let i = 0; i < batchCount; i++) {
      const patients = await Patient.findAll({
        ...query,
        limit: batchSize,
      });

      for (const patient of patients) {
        // do stuff
        log.info('Vaccination reminder created', { patientId: patient.id });
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }
  }
}
