import config from 'config';

import {
  shouldPush,
  shouldPull,
  createImportPlan,
  executeImportPlan,
  createExportPlan,
  executeExportPlan,
  MODEL_DEPENDENCY_ORDER,
} from 'shared/models/sync';
import { log } from 'shared/services/logging';
import { calculateDynamicPullLimit } from './calculateDynamicPullLimit';

const { readOnly, dynamicLimiter } = config.sync;

const { exportLimit: EXPORT_LIMIT, initialPullLimit: INITIAL_PULL_LIMIT } = dynamicLimiter;

export class SyncManager {
  token = '';

  context = null;

  jobQueue = [];

  workerPromise = null;

  constructor(context) {
    this.context = context;
  }

  async pullAndImport(model, patientId) {
    const channels = await model.syncConfig.getChannels(patientId);
    const channelsWithCursors = await this.getChannelPullCursors(channels);
    const channelsToPull =
      channels.length === 1
        ? channels // waste of effort to check which need pulling if there's only 1, just pull
        : await this.context.remote.fetchChannelsWithChanges(channelsWithCursors);

    if (channelsToPull.length === 0) {
      log.info(`SyncManager.pullAndImport: no changes to pull`, { model: model.name });
      return;
    }

    const channelsToPullSet = new Set(channelsToPull);
    log.info(`SyncManager.pullAndImport: found channels to pull`, {
      model: model.name,
      count: channelsToPull.length,
    });

    for (const { channel, cursor } of channelsWithCursors) {
      if (channelsToPullSet.has(channel)) {
        await this.pullAndImportChannel(model, channel, cursor);
      }
    }
  }

  async pullAndImportChannel(model, channel, initialCursor = '0') {
    const plan = createImportPlan(model.sequelize, channel);
    const importRecords = async syncRecords => {
      await executeImportPlan(plan, syncRecords);
    };

    let cursor = initialCursor;
    let limit = INITIAL_PULL_LIMIT;
    log.debug(`SyncManager.pullAndImport: syncing`, { channel, cursor });

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // pull
      log.debug(`SyncManager.pullAndImport: pulling records`, {
        channel,
        cursor,
        limit,
      });
      const startTime = Date.now();
      const result = await this.context.remote.pull(channel, {
        since: cursor,
        limit,
        noCount: 'true',
      });
      cursor = result.cursor;
      const syncRecords = result.records;
      if (syncRecords.length === 0) {
        log.debug(`SyncManager.pullAndImport: reached end of channel`, { channel });
        break;
      }

      // import
      log.debug(`SyncManager.pullAndImport: importing records`, {
        count: syncRecords.length,
        model: model.name,
        channel,
      });
      await importRecords(syncRecords);
      await this.setChannelPullCursor(channel, cursor);
      const pullTime = Date.now() - startTime;
    }
  }

  async exportAndPush(model, patientId) {
    for (const channel of await model.syncConfig.getChannels(patientId)) {
      await this.exportAndPushChannel(model, channel);
      limit = calculateDynamicPullLimit(limit, pullTime);
    }
  }

  async exportAndPushChannel(model, channel) {
    log.debug(`SyncManager.exportAndPush: syncing`, { channel, model: model.name });

    // export
    const plan = createExportPlan(model.sequelize, channel);
    const exportRecords = (cursor = null, limit = EXPORT_LIMIT) => {
      log.debug(`SyncManager.exportAndPush: exporting a batch`, {
        limit,
        cursor,
      });
      return executeExportPlan(plan, { since: cursor, limit });
    };

    // mark + unmark
    const markRecords = async () => {
      await model.update(
        { isPushing: true, markedForPush: false },
        {
          where: {
            markedForPush: true,
          },
          // skip validation - no sync fields should be used in model validation
          validate: false,
        },
      );
    };
    const unmarkRecords = async records => {
      await model.update(
        { isPushing: false, pushedAt: new Date() },
        {
          where: {
            id: records.map(r => r.data.id),
          },
          // skip validation - no sync fields should be used in model validation
          validate: false,
        },
      );
    };

    let cursor = null;
    await markRecords();
    do {
      const exportResponse = await exportRecords(cursor);
      const { records } = exportResponse;
      if (records.length > 0) {
        log.debug(`SyncManager.exportAndPush: pushing to sync server`, { count: records.length });
        await this.context.remote.push(channel, records);
        await unmarkRecords(records);
      }
      cursor = exportResponse.cursor;
    } while (cursor);

    log.debug(`SyncManager.exportAndPush: reached end of channel`, { channel });
  }

  async runSync(patientId = null) {
    if (!config.sync.enabled) {
      log.warn('SyncManager.runSync: sync is disabled');
      return;
    }

    const run = async () => {
      const startTimestampMs = Date.now();
      log.info(`SyncManager.runSync.run: began sync run`);
      const { models } = this.context;

      const modelsToSync = MODEL_DEPENDENCY_ORDER.map(name => models[name]);

      for (const model of modelsToSync) {
        if (!readOnly && shouldPush(model)) {
          await this.exportAndPush(model, patientId);
        }
        if (shouldPull(model)) {
          await this.pullAndImport(model, patientId);
        }
      }
      const elapsedTimeMs = Date.now() - startTimestampMs;
      log.info(`SyncManager.runSync.run: finished sync run in ${elapsedTimeMs}ms`);
    };

    // queue up new job
    if (this.patientId) {
      // patient-specific jobs go on the end of the queue
      this.jobQueue.push(run);
    } else {
      // global jobs replace the rest of the queue, since they sync everything anyway
      this.jobQueue = [run];
    }

    // if there's no existing job, begin working through the queue
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        try {
          while (this.jobQueue.length > 0) {
            const job = this.jobQueue.pop();
            await job();
          }
        } finally {
          this.workerPromise = null;
        }
      })();
    }

    // wait for the queue to be processed
    await this.workerPromise;
  }
}
