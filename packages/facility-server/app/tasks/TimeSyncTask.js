import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class TimeSyncTask extends ScheduledTask {
  context = null;

  getName() {
    return 'TimeSyncTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = config.timeSync;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.runImmediately();
  }

  async run() {
    return this.context.timesync.attemptSync(config.sync);
  }
}
