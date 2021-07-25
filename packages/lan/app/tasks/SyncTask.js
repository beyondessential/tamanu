import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class SyncTask extends ScheduledTask {
  context = null;

  constructor(context) {
    super(config.sync.schedule, log);
    this.context = context;
    this.runImmediately();
  }

  getName() {
    return 'SyncTask';
  }

  async run() {
    return this.context.syncManager.runSync();
  }
}
