import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class SyncTask extends ScheduledTask {
  context = null;

  getName() {
    return 'SyncTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = config.sync;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.runImmediately();
  }

  async run() {
    return this.context.syncManager.triggerSync({
      type: 'scheduled',
      urgent: false,
    });
  }
}
