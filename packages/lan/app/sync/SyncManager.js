import PromisePool from '@mixmaxhq/promise-pool';
import {
  shouldPush,
  shouldPull,
  createImportPlan,
  executeImportPlan,
  createExportPlan,
  executeExportPlan,
} from 'shared/models/sync';
import { log } from 'shared/services/logging';
import { DependencyGraph } from 'shared/utils';

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

  async pullAndImportChannel(model, channel) {
    const since = await this.getLastSynced(channel);
    log.debug(`SyncManager.pullAndImport: syncing ${channel} (last: ${since})`);

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

    log.debug(`SyncManager.pullAndImport: finished syncing ${channel}`);
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

  async runSyncImmediately(patientId = null) {
    log.info(`SyncManager: starting sync (patientId = ${patientId})`);

    const { models } = this.context;

    // form a graph of dependencies based on which models belong to others
    const graph = DependencyGraph.fromModels(models);

    // limit concurrent channel syncs using a promise pool
    const pool = new PromisePool({
      // number of channels to sync concurrently
      numConcurrent: MAX_CONCURRENT_CHANNEL_SYNCS,
      // at most we'll have one pending start() call per model - more than that is a bug
      maxPending: Object.keys(models).length,
    });

    // run syncs as soon as their dependencies complete
    await graph.run(async modelName => {
      const model = models[modelName];

      // keep track of how many channels have completed
      let numCompleted = 0;
      const channels = await model.getChannels(patientId);

      const syncChannel = async (channel, resolve) => {
        if (shouldPull(model)) {
          await this.pullAndImportChannel(model, channel);
        }
        if (shouldPush(model)) {
          await this.exportAndPushChannel(model, channel);
        }

        // resolve our promise once all channels have completed
        numCompleted++;
        if (numCompleted === channels.length) {
          resolve();
        }
      };

      // wait for all channels to complete before leaving this model's function
      if (channels.length > 0) {
        await new Promise((resolve, reject) => {
          (async () => {
            try {
              for (const channel of channels) {
                await pool.start(syncChannel, channel, resolve);
              }
            } catch (e) {
              reject(e);
            }
          })();
        });
      }
    });

    // wait for any remaining promises to complete (probably unnecessary)
    await pool.flush();

    log.info(`SyncManager: ending sync`);
  }

  async runSync(patientId = null) {
    const run = async () => this.runSyncImmediately(patientId);

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
