import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class SyncLookupRefresher extends ScheduledTask {
  getName() {
    return `SyncLookupRefresher`;
  }

  constructor(context, options) {
    const conf = config.schedules.syncLookupRefresher;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.store.models;
    this.options = options;
  }

  async run() {
    await this.context.centralSyncManager.updateLookupTable();
  }
}
