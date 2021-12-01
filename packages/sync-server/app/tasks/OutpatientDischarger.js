import config from 'config';
import moment from 'moment';
import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';

// As well as the sync import auto-discharging old encounters on the way in, we also need a daily
// task to clean up any that synced in on the same day as they were created
export class OutpatientDischarger extends ScheduledTask {
  getName() {
    return 'OutpatientDischarger';
  }

  constructor(context) {
    super(config.schedules.outpatientDischarger.schedule, log);
    this.models = context.store.models;

    // run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    const startOfToday = moment()
      .startOf('day')
      .toDate();

    const where = {
      encounterType: 'clinic',
      endDate: null,
      startDate: {
        [Op.lt]: startOfToday,
      },
    };

    const oldEncountersCount = await this.models.Encounter.count({ where });

    if (oldEncountersCount === 0) {
      log.info('No old clinic encounters. Stopping OutpatientDischarger...');
      return;
    }

    const batchSize = config.schedules.outpatientDischarger.batchSize;
    const batchCount = Math.ceil(oldEncountersCount / batchSize);
    const batchSleepAsyncDurationInMilliseconds =
      config.schedules.outpatientDischarger.batchSleepAsyncDurationInMilliseconds;

    log.info(
      `Auto-closing ${oldEncountersCount} clinic encounters in ${batchCount} batches (${batchSize} records per batch)`,
    );

    for (let i = 0; i < batchCount; i++) {
      const oldEncounters = await this.models.Encounter.findAll({
        where,
        limit: batchSize,
      });

      for (const oldEncounter of oldEncounters) {
        await oldEncounter.update({
          endDate: startOfToday,
          dischargeNote: 'Automatically discharged',
        });
        log.info(`Auto-closed encounter with id ${oldEncounter.id}`);
      }

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    log.info('OutpatientDischarger finished running');
  }
}
