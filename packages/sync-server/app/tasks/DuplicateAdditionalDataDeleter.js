import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import {
  countAffectedPatients,
  removeDuplicatedPatientAdditionalData,
} from '../utils/removeDuplicatedPatientAdditionalData';

export class DuplicateAdditionalDataDeleter extends ScheduledTask {
  getName() {
    return 'DuplicateAdditionalDataDeleter';
  }

  constructor(context) {
    const conf = config.schedules.duplicateAdditionalDataDeleter;
    super(conf.schedule, log);
    this.sequelize = context.store.sequelize;
  }

  async countQueue() {
    return countAffectedPatients(this.sequelize);
  }

  async run() {
    return removeDuplicatedPatientAdditionalData(this.sequelize);
  }
}
