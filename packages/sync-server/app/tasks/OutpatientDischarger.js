import config from 'config';
import moment from 'moment';

import { Op } from 'sequelize';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

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
    const oldEncounters = await this.models.Encounter.findAll({
      where: {
        encounterType: 'clinic',
        endDate: null,
        startDate: {
          [Op.lt]: moment()
            .startOf('day')
            .toDate(),
        },
      },
    });

    if (oldEncounters.length === 0) return;

    log.info(`Auto-closing ${oldEncounters.length} clinic encounters`);

    const tasks = oldEncounters.map(async encounter => {
      await encounter.update({
        endDate: this.models.Encounter.getAutoDischargeEndDate(encounter),
        dischargeNote: 'Automatically discharged',
      });
      log.info(`Auto-closed encounter with id ${encounter.id}`);
    });

    await Promise.all(tasks);
  }
}
