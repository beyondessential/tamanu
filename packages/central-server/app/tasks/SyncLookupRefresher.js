import config from 'config';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

export class SyncLookupRefresher extends ScheduledTask {
  getName() {
    return `SyncLookupRefresher`;
  }

  constructor(context, options) {
    const conf = config.schedules.syncLookupRefresher;
    const { schedule, jitterTime, enabled, updateLookupTableTimeoutMs } = conf;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.store.models;
    this.options = options;
    this.updateLookupTableTimeoutMs = updateLookupTableTimeoutMs;
  }

  async run() {
    let transactionTimeout;

    try {
      if (this.updateLookupTableTimeoutMs) {
        transactionTimeout = setTimeout(() => {
          throw new Error(`Updating lookup table timed out`);
        }, this.updateLookupTableTimeoutMs);
      }
      await this.context.centralSyncManager.updateLookupTable();
    } finally {
      if (transactionTimeout) clearTimeout(transactionTimeout);
    }
  }
}
