import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class SyncTask extends ScheduledTask {
  context = null;

  getName() {
    return 'SyncTask';
  }

  constructor(context) {
    const { schedule, jitterTime } = config.sync;
    super(schedule, log, jitterTime);
    this.context = context;
    this.runImmediately();
  }

  async run() {
    // trigger a sync to immediately start pulling data for this patient
    return this.context.syncConnection.runSync({
      type: 'subcommand',
      urgent: true,
    });
  }
}
