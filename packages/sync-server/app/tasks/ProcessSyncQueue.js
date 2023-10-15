import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { SYNC_QUEUE_STATUSES } from '@tamanu/constants';

export class ProcessSyncQueue extends ScheduledTask {
  getName() {
    return 'ProcessSyncQueue';
  }

  constructor(context) {
    const conf = config.schedules.processSyncQueue;
    super(conf.schedule, log);
    this.config = conf;
    this.store = context.store;
  }

  async run() {
    const { SyncQueuedDevice } = this.store.models;

    const waitingInQueue = await SyncQueuedDevice.count({
      where: SyncQueuedDevice.getQueueWhereClause(),
    });

    if (waitingInQueue > 0) {
      log.info("ProcessSyncQueue.waitingInQueue", { count: waitingInQueue });
      return;
    }

    const updated = await SyncQueuedDevice.update({
      status: SYNC_QUEUE_STATUSES.READY,
    }, {
      where: {
        status: SYNC_QUEUE_STATUSES.QUEUED,
      },
    });
    log.info("ProcessSyncQueue.movedQueuedToReady", { count: updated });
  }
}
