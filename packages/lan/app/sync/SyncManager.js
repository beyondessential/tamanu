import asyncPool from 'tiny-async-pool';
import {
  shouldPush,
  shouldPull,
  createImportPlan,
  executeImportPlan,
  createExportPlan,
  executeExportPlan,
} from 'shared/models/sync';
import { log } from 'shared/services/logging';

const EXPORT_LIMIT = 100;

const MAX_CONCURRENT_CHANNEL_SYNCS = 4;

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
    await asyncPool(MAX_CONCURRENT_CHANNEL_SYNCS, await model.getChannels(patientId), channel =>
      this.pullAndImportChannel(model, channel),
    );
  }

  async pullAndImportChannel(model, channel) {
    const since = await this.getLastSynced(channel);
    log.info(`SyncManager.pullAndImport: syncing ${channel} (last: ${since})`);

    const plan = createImportPlan(model);
    const importRecords = async syncRecords => {
      for (const syncRecord of syncRecords) {
        await executeImportPlan(plan, channel, syncRecord);
      }
    };

    let lastCount = 0;
    let page = 0;
    let requestedAt = null;
    do {
      // pull
      log.debug(`SyncManager.pullAndImport: pulling page ${page} of ${channel}`);
      const result = await this.context.remote.pull(channel, { page, since });
      const syncRecords = result.records;
      requestedAt =
        requestedAt === null ? result.requestedAt : Math.min(requestedAt, result.requestedAt);
      lastCount = syncRecords.length;
      if (lastCount === 0) {
        log.debug(`SyncManager.pullAndImport: reached end of ${channel}`);
        break;
      }

      // import
      log.debug(`SyncManager.pullAndImport: importing ${syncRecords.length} ${model.name} records`);
      await importRecords(syncRecords);

      page++;
    } while (lastCount);

    // TODO: retry foreign key failures?
    // Right now, our schema doesn't have any cycles in it, so neither retries nor stubs are strictly necessary.
    // However, they're implemented on mobile, so perhaps we should either remove them there or add them here.

    await this.setLastSynced(channel, requestedAt);
  }

  async exportAndPush(model, patientId) {
    await asyncPool(MAX_CONCURRENT_CHANNEL_SYNCS, await model.getChannels(patientId), channel =>
      this.exportAndPushChannel(model, channel),
    );
  }

  async exportAndPushChannel(model, channel) {
    log.debug(`SyncManager.exportAndPush: syncing ${channel}`);

    // export
    const plan = createExportPlan(model);
    const exportRecords = (after = null, limit = EXPORT_LIMIT) => {
      log.debug(
        `SyncManager.exportAndPush: exporting up to ${limit} records after ${after?.data?.id}`,
      );
      return executeExportPlan(plan, channel, { after, limit });
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

    let after = null;
    do {
      const records = await exportRecords(after);
      after = records[records.length - 1] || null;
      if (records.length > 0) {
        log.debug(`SyncManager.exportAndPush: pushing ${records.length} to sync server`);
        await this.context.remote.push(channel, records);
        await unmarkRecords(records);
      }
    } while (after !== null);

    log.debug(`SyncManager.exportAndPush: reached end of ${channel}`);
  }

  async getLastSynced(channel) {
    const metadata = await this.context.models.SyncMetadata.findOne({ where: { channel } });
    return metadata?.lastSynced || 0;
  }

  async setLastSynced(channel, lastSynced) {
    await this.context.models.SyncMetadata.upsert({ channel, lastSynced });
  }

  async runSync(patientId = null) {
    const run = async () => {
      const { models } = this.context;

      // ordered array because some models depend on others
      const modelsToSync = [
        models.ReferenceData,
        models.User,

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

        models.LabTestType,
        models.Encounter,
      ];

      for (const model of modelsToSync) {
        if (shouldPull(model)) {
          await this.pullAndImport(model, patientId);
        }
        if (shouldPush(model)) {
          await this.exportAndPush(model, patientId);
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
