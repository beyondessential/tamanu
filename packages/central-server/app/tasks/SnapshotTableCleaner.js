import config from 'config';
import { subHours } from 'date-fns';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import {
  dropMarkedForSyncPatientsTable,
  dropSnapshotTable,
} from '@tamanu/database/sync';

import { InvalidConfigError } from '.';

export class SnapshotTableCleaner extends ScheduledTask {
  getName() {
    return 'SnapshotTableCleaner';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.snapshotTableCleaner,
      ...overrideConfig,
    };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.store = context.store;
  }

  getWhere() {
    return {
      completedAt: { [Op.lt]: subHours(new Date(), this.config.retentionHours) },
      errors: { [Op.not]: null },
      snapshotDroppedAt: { [Op.is]: null },
    };
  }

  async countQueue() {
    const { SyncSession } = this.store.models;
    return SyncSession.count({ where: this.getWhere() });
  }

  async run() {
    const { SyncSession } = this.store.models;
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for SnapshotTableCleaner',
      );
    }

    const sessions = await SyncSession.findAll({
      where: this.getWhere(),
      attributes: ['id'],
      order: [['completedAt', 'ASC']],
      limit: batchSize,
      raw: true,
    });

    if (sessions.length === 0) return;

    log.info('SnapshotTableCleaner.startBatch', { batchSize: sessions.length });

    const droppedIds = [];
    for (let i = 0; i < sessions.length; i++) {
      const { id } = sessions[i];
      try {
        await dropSnapshotTable(this.store.sequelize, id);
        await dropMarkedForSyncPatientsTable(this.store.sequelize, id);
        droppedIds.push(id);
      } catch (error) {
        log.warn('SnapshotTableCleaner.dropFailed', {
          sessionId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      if (i < sessions.length - 1) {
        await sleepAsync(batchSleepAsyncDurationInMilliseconds);
      }
    }

    if (droppedIds.length > 0) {
      await SyncSession.update(
        { snapshotDroppedAt: new Date() },
        { where: { id: { [Op.in]: droppedIds } } },
      );
    }
  }
}
