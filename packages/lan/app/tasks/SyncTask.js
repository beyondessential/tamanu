import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class SyncTask extends ScheduledTask {
  context = null;

  getName() {
    return 'SyncTask';
  }

  constructor(context) {
    const { schedules } = context;
    super(schedules.sync.schedule, log);
    this.context = context;
    this.runImmediately();
  }

  async run() {
    return this.context.syncManager.triggerSync('scheduled');
  }
}
