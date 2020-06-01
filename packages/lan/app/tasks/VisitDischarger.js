import config from 'config';
import moment from 'moment';
import shortid from 'shortid';

import { Op } from 'sequelize';

import { log } from '~/logging';
import { ScheduledTask } from './ScheduledTask';

export class VisitDischarger extends ScheduledTask {
  constructor(context) {
    super(config.schedules.visitDischarger);
    this.context = context;

    // run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    const { models } = this.context;

    const oldVisits = await models.Visit.findAll({
      where: {
        visitType: 'clinic',
        endDate: null,
        startDate: {
          [Op.lt]: moment().startOf('day').toDate(),
        }
      }
    });

    if (oldVisits.length === 0) return;

    log.info(`Auto-closing ${oldVisits.length} clinic visits`);

    const closingDate = moment()
      .startOf('day')
      .subtract(1, 'minute')
      .toDate();


    for(let i = 0; i < oldVisits.length; ++i) {
      const visit = oldVisits[i];
      await visit.update({ 
        endDate: closingDate,
        dischargeNote: 'Automatically discharged',
      });
      log.info(`Auto-closed visit with id ${visit.id}`);
    }
  }
}
