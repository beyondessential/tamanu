import {
  shouldPush,
  shouldPull,
  createImportPlan,
  executeImportPlan,
  createExportPlan,
  executeExportPlan,
} from 'shared/models/sync';
import { log } from 'shared/services/logging';
import config from 'config';

const { readOnly } = config.sync;

const EXPORT_LIMIT = 100;
const INITIAL_PULL_LIMIT = 100;
const MIN_PULL_LIMIT = 1;
const MAX_PULL_LIMIT = 10000;
const OPTIMAL_PULL_TIME_PER_PAGE = 2000; // aim for 2 seconds per page
const MAX_LIMIT_CHANGE_PER_BATCH = 0.2; // max 20% increase from batch to batch, or it is too jumpy

// Set the current page size based on how long the previous page took to complete.
const calculateDynamicLimit = (currentLimit, pullTime) => {
  const durationPerRecord = pullTime / currentLimit;
  const optimalPageSize = OPTIMAL_PULL_TIME_PER_PAGE / durationPerRecord;
  let newLimit = optimalPageSize;

  newLimit = Math.floor(newLimit);
  newLimit = Math.max(
    newLimit,
    MIN_PULL_LIMIT,
    Math.floor(currentLimit - currentLimit * MAX_LIMIT_CHANGE_PER_BATCH),
  );
  newLimit = Math.min(
    newLimit,
    MAX_PULL_LIMIT,
    Math.floor(currentLimit + currentLimit * MAX_LIMIT_CHANGE_PER_BATCH),
  );
  return newLimit;
};

export class SyncManager {
  host = '';

  token = '';

  context = null;

  jobQueue = [];

  workerPromise = null;

  constructor(context) {
    this.context = context;
  }

  async pullAndImport(model, patientId) {
    const channels = await model.getChannels(patientId);
    const channelsWithCursors = await Promise.all(
      channels.map(async channel => {
        const cursor = await this.getChannelPullCursor(channel);
        return { channel, cursor };
      }),
    );
    const channelsToPull =
      channels.length === 1
        ? channels // waste of effort to check which need pulling if there's only 1, just pull
        : await this.context.remote.fetchChannelsWithChanges(channelsWithCursors);
    const channelsToPullSet = new Set(channelsToPull);
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
    log.info(`SyncManager.pullAndImport: syncing ${channel} (last: ${cursor})`);
    while (true) {
      // pull
      log.debug(
        `SyncManager.pullAndImport: pulling ${limit} records since ${cursor} for ${channel}`,
      );
      const startTime = Date.now();
      const result = await this.context.remote.pull(channel, { since: cursor, limit });
      cursor = result.cursor;
      const syncRecords = result.records;
      if (syncRecords.length === 0) {
        log.debug(`SyncManager.pullAndImport: reached end of ${channel}`);
        break;
      }

      // import
      log.debug(`SyncManager.pullAndImport: importing ${syncRecords.length} ${model.name} records`);
      await importRecords(syncRecords);
      await this.setChannelPullCursor(channel, cursor);
      const pullTime = Date.now() - startTime;
      limit = calculateDynamicLimit(limit, pullTime);
    }
  }

  async exportAndPush(model, patientId) {
    for (const channel of await model.getChannels(patientId)) {
      await this.exportAndPushChannel(model, channel);
    }
  }

  async exportAndPushChannel(model, channel) {
    log.debug(`SyncManager.exportAndPush: syncing ${channel}`);

    // export
    const plan = createExportPlan(model.sequelize, channel);
    const exportRecords = (cursor = null, limit = EXPORT_LIMIT) => {
      log.debug(`SyncManager.exportAndPush: exporting up to ${limit} records since ${cursor}`);
      return executeExportPlan(plan, { since: cursor, limit });
    };

    // unmark
    const unmarkRecords = async records => {
      // TODO use bulk update after https://github.com/beyondessential/tamanu-backlog/issues/463
      const modelInstances = await model.findAll({
        where: {
          id: records.map(r => r.data.id),
        },
      });
      await Promise.all(
        modelInstances.map(m => {
          m.markedForPush = false;
          m.pushedAt = new Date();
          return m.save();
        }),
      );
    };

    let cursor = null;
    do {
      const exportResponse = await exportRecords(cursor);
      const { records } = exportResponse;
      if (records.length > 0) {
        log.debug(`SyncManager.exportAndPush: pushing ${records.length} to sync server`);
        await this.context.remote.push(channel, records);
        await unmarkRecords(records);
      }
      cursor = exportResponse.cursor;
    } while (cursor);

    log.debug(`SyncManager.exportAndPush: reached end of ${channel}`);
  }

  async getChannelPullCursor(channel) {
    const metadata = await this.context.models.SyncMetadata.findOne({ where: { channel } });
    return metadata?.pullCursor || '0';
  }

  async setChannelPullCursor(channel, pullCursor) {
    await this.context.models.SyncMetadata.upsert({ channel, pullCursor });
  }

  async runSync(patientId = null) {
    const run = async () => {
      const { models } = this.context;

      // ordered array because some models depend on others
      const modelsToSync = [
        models.ReferenceData,
        models.User,
        models.Asset,

        models.ScheduledVaccine,

        models.Program,
        models.Survey,
        models.ProgramDataElement,
        models.SurveyScreenComponent,

        models.Patient,
        models.PatientAllergy,
        models.PatientCarePlan,
        models.PatientCondition,
        models.PatientFamilyHistory,
        models.PatientIssue,
        models.PatientAdditionalData,

        models.LabTestType,
        models.Encounter,
        models.ReportRequest,
        models.Location,
        models.UserFacility,
      ];

      for (const model of modelsToSync) {
        if (!readOnly && shouldPush(model)) {
          await this.exportAndPush(model, patientId);
        }
        if (shouldPull(model)) {
          await this.pullAndImport(model, patientId);
        }
      }
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
