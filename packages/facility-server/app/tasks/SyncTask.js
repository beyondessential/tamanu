import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import config from 'config';

export class SyncTask extends ScheduledTask {
  context = null;

  getName() {
    return 'SyncTask';
  }

  constructor(context) {
    const { schedules } = context;
    const { jitterTime } = config.sync;
    super(schedules.sync.schedule, log, jitterTime);
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
