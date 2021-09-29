import config from 'config';
import moment from 'moment';
import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

const ENCOUNTERS_BATCH_SIZE = 1000;

// As well as the sync import auto-discharging old encounters on the way in, we also need a daily
// task to clean up any that synced in on the same day as they were created
export class OutpatientDischarger extends ScheduledTask {
  getName() {
    return 'OutpatientDischarger';
  }

  constructor(context) {
    super(config.schedules.outpatientDischarger, log);
    this.models = context.store.models;

    // run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    const where = {
      encounterType: 'clinic',
      endDate: null,
      startDate: {
        [Op.lt]: moment()
          .startOf('day')
          .toDate(),
      },
    };

    const oldEncountersCount = await this.models.Encounter.count({ where });

    if (oldEncountersCount === 0) {
      log.info('No old clinic encounters. Stopping OutpatientDischarger...');
      return;
    }

    const batchCount = Math.ceil(oldEncountersCount / ENCOUNTERS_BATCH_SIZE);

    log.info(
      `Auto-closing ${oldEncountersCount} clinic encounters in ${batchCount} batches (${ENCOUNTERS_BATCH_SIZE} records per batch)`,
    );

    for (let i = 0; i < batchCount; i++) {
      const oldEncounters = await this.models.Encounter.findAll({
        where,
        limit: ENCOUNTERS_BATCH_SIZE,
      });
      const tasks = oldEncounters.map(async encounter => {
        await encounter.update({
          endDate: moment()
            .startOf('day')
            .toDate(),
          dischargeNote: 'Automatically discharged',
        });
        log.info(`Auto-closed encounter with id ${encounter.id}`);
      });

      await Promise.all(tasks);
    }

    log.info('OutpatientDischarger finished running');
  }
}
