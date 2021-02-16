import config from 'config';

import { log } from '~/logging';
import { ScheduledTask } from 'shared/tasks';

import { SyncManager } from '~/sync';

export class SyncTask extends ScheduledTask {
  constructor(context) {
    super(config.sync.schedule, log);

    this.manager = new SyncManager(context);

    this.run();
  }

  async run() {
    return this.manager.runSync();
  }
}
