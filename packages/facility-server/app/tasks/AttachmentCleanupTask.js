import config from 'config';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

export class AttachmentCleanupTask extends ScheduledTask {
  getName() {
    return 'AttachmentCleanupTask';
  }

  constructor(context) {
    const conf = config.schedules.attachmentCleanup;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.models = context.models;
    this.sequelize = context.sequelize;
  }

  async run() {
    const lastSuccessfulPush = await this.models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH);
    if (!lastSuccessfulPush) {
      log.info('AttachmentCleanupTask: No successful sync push found, skipping cleanup');
      return;
    }

    const lastSuccessfulPushTick = parseInt(lastSuccessfulPush, 10);
    log.info('AttachmentCleanupTask: Starting cleanup', { lastSuccessfulPushTick });

    // Find attachments that have been successfully synced
    const toProcess = await this.models.Attachment.count({
      where: {
        updatedAtSyncTick: {
          [Op.lt]: lastSuccessfulPushTick,
        },
      },
      paranoid: false,
    });

    if (toProcess === 0) {
      log.info('AttachmentCleanupTask: No attachments to cleanup');
      return;
    }

    log.info('AttachmentCleanupTask: Found attachments to cleanup', {
      count: toProcess,
    });

    const batchSize = this.config.batchSize || 1000;
    const batchSleepAsyncDurationInMilliseconds = this.config.batchSleepAsyncDurationInMilliseconds || 50;
    const batchCount = Math.ceil(toProcess / batchSize);
    let deletedCount = 0;

    for (let i = 0; i < batchCount; i++) {
      const batch = await this.models.Attachment.findAll({
        where: {
          updatedAtSyncTick: {
            [Op.lt]: lastSuccessfulPushTick,
          },
        },
        paranoid: false,
        limit: batchSize,
      });
      const attachmentIds = batch.map(att => att.id);

      await this.models.Attachment.destroy({
        where: {
          id: { [Op.in]: attachmentIds },
        },
        force: true,
      });

      deletedCount += batch.length;
      log.info('AttachmentCleanupTask: Deleted batch', {
        batchNumber: i + 1,
        batchSize: batch.length,
        totalDeleted: deletedCount,
      });

      await sleepAsync(batchSleepAsyncDurationInMilliseconds);
    }

    log.info('AttachmentCleanupTask: Cleanup completed', {
      totalDeleted: deletedCount,
      lastSuccessfulPushTick,
    });
  }
} 