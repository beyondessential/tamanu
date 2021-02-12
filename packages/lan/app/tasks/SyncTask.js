import config from 'config';
import moment from 'moment';
import shortid from 'shortid';

import { Op } from 'sequelize';

import { log } from '~/logging';
import { ScheduledTask } from 'shared/tasks';

import { SyncManager } from '~/sync';

export class SyncTask extends ScheduledTask {
  constructor(context) {
    super(config.sync.schedule, log);

    this.manager = new SyncManager(context);

    // run once on startup (in case the server was down when it was scheduled)
    this.run();
  }

  async run() {
    return this.manager.runSync();
  }
}
