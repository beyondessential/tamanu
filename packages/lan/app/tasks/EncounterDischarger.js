import config from 'config';
import moment from 'moment';
import shortid from 'shortid';

import { Op } from 'sequelize';

import { log } from '~/logging';
import { ScheduledTask } from './ScheduledTask';

export class EncounterDischarger extends ScheduledTask {
  constructor(context) {
    super(config.schedules.encounterDischarger);
    this.context = context;

    // run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    const { models } = this.context;

    const oldEncounters = await models.Encounter.findAll({
      where: {
        encounterType: 'clinic',
        endDate: null,
        startDate: {
          [Op.lt]: moment().startOf('day').toDate(),
        }
      }
    });

    if (oldEncounters.length === 0) return;

    log.info(`Auto-closing ${oldEncounters.length} clinic encounters`);

    const closingDate = moment()
      .startOf('day')
      .subtract(1, 'minute')
      .toDate();


    const tasks = oldEncounters.map(async encounter => {
      await encounter.update({ 
        endDate: closingDate,
        dischargeNote: 'Automatically discharged',
      });
      log.info(`Auto-closed encounter with id ${encounter.id}`);
    });

    return Promise.all(tasks);
  }
}
