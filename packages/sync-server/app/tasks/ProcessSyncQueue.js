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

    const readyDevices = await SyncQueuedDevice.count({
      where: SyncQueuedDevice.getReadyDevicesWhereClause(),
    });

    if (readyDevices > 0) {
      log.info('ProcessSyncQueue.devicesReady', { count: readyDevices });
      return;
    }

    const updated = await SyncQueuedDevice.update(
      {
        status: SYNC_QUEUE_STATUSES.READY,
      },
      {
        where: {
          status: SYNC_QUEUE_STATUSES.QUEUED,
        },
      },
    );
    log.info('ProcessSyncQueue.movedQueuedToReady', { count: updated });
  }
}
