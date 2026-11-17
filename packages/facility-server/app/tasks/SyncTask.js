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
  }

  beginPolling() {
    super.beginPolling();
    // Sync straight away rather than at the first scheduled time. Here rather than in the
    // constructor, so the run is recorded and held like any other (see recordScheduledTaskRuns).
    this.runImmediately();
  }

  async run() {
    // Not configured yet (first-run setup) — skip until the runtime is wired up.
    if (!this.context.syncManager) {
      return;
    }
    return this.context.syncManager.triggerSync({
      type: 'scheduled',
      urgent: false,
    });
  }
}
