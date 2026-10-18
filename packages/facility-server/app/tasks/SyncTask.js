import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

import { isSyncEnabled } from '../serverConfig';

export class SyncTask extends ScheduledTask {
  context = null;

  getName() {
    return 'SyncTask';
  }

  constructor(context) {
    const { schedule, jitterTime } = config.sync;
    super(schedule, log, jitterTime, isSyncEnabled());
    this.context = context;
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
