import config from 'config';
import moment from 'moment';
import shortid from 'shortid';

import { ScheduledTask } from './ScheduledTask';

export class VisitDischarger extends ScheduledTask {
  constructor(database) {
    super(config.schedules.visitDischarger);
    this.database = database;

    // run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    const oldVisits = this.database
      .objects('visit')
      .filtered('visitType = $0 and endDate = null', 'clinic')
      .filtered('startDate < $0', moment().startOf('day').toDate());

    if(oldVisits.length === 0) return;
    
    console.log(`Auto-closing ${oldVisits.length} clinic visits`);
    this.database.write(() => {
      oldVisits.map(visit => {
        visit.endDate = new Date();

        const note = {
          _id: shortid.generate(),
          type: 'system',
          content: 'Automatically discharged',
        };

        visit.notes = [...visit.notes, note];
      });
    });
  }
}
