import config from 'config';
import { startOfDay, sub } from 'date-fns';
import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';
import { InvalidConfigError } from 'shared/errors';

// As well as the sync import auto-discharging old encounters on the way in, we also need a daily
// task to clean up any that synced in on the same day as they were created
export class OutpatientDischarger extends ScheduledTask {
  getName() {
    return 'OutpatientDischarger';
  }

  constructor(context) {
    const conf = config.schedules.outpatientDischarger;
    super(conf.schedule, log);
    this.config = conf;
    this.models = context.store.models;

    // run once on startup (in case the server was down when it was scheduled)
    this.runImmediately();
  }

  async countQueue() {
    const startOfToday = startOfDay(new Date());

    const where = {
      encounterType: 'clinic',
      endDate: null,
      startDate: {
        [Op.lt]: startOfToday,
      },
    };

    return this.models.Encounter.count({ where });
  }

  async run() {
    const startOfToday = startOfDay(new Date());

    const where = {
      encounterType: 'clinic',
      endDate: null,
      startDate: {
        [Op.lt]: startOfToday,
      },
    };

    const oldEncountersCount = await this.models.Encounter.count({ where });
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    // Make sure these exist, else they will prevent the script from working
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for OutpatientDischarger',
      );
    }

    const batchCount = Math.ceil(oldEncountersCount / batchSize);

    log.info(
      `Auto-closing ${oldEncountersCount} clinic encounters in ${batchCount} batches (${batchSize} records per batch)`,
    );

    const justBeforeMidnight = sub(startOfToday, { minutes: 1 });
    for (let i = 0; i < batchCount; i++) {
      const oldEncounters = await this.models.Encounter.findAll({
        where,
        limit: batchSize,
      });

      for (const oldEncounter of oldEncounters) {
        await oldEncounter.update({
          endDate: justBeforeMidnight,
          dischargeNote: 'Automatically discharged',
        });
        log.info(`Auto-closed encounter with id ${oldEncounter.id}`);
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    log.info('OutpatientDischarger finished running');
  }
}
