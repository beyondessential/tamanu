import {
  shouldPush,
  shouldPull,
  createImportPlan,
  executeImportPlan,
  createExportPlan,
  executeExportPlan,
} from 'shared/models/sync';
import { log } from '~/logging';

const EXPORT_LIMIT = 100;

export class SyncManager {
  host = '';

  token = '';

  context = null;

  constructor(context, remote) {
    this.context = context;
    this.remote = remote;
  }

  async pullAndImport(model) {
    for (const channel of await model.getChannels()) {
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
        const result = await this.remote.pull(channel, { page, since });
        const syncRecords = result.records;
        requestedAt =
          requestedAt === null ? result.requestedAt : Math.min(requestedAt, result.requestedAt);
        lastCount = syncRecords.length;
        if (lastCount === 0) {
          log.debug(`SyncManager.pullAndImport: reached end of ${channel}`);
          break;
        }

        // import
        log.debug(
          `SyncManager.pullAndImport: importing ${syncRecords.length} ${model.name} records`,
        );
        await importRecords(syncRecords);

        page++;
      } while (lastCount);

      // TODO: retry foreign key failures?
      // Right now, our schema doesn't have any cycles in it, so neither retries nor stubs are strictly necessary.
      // However, they're implemented on mobile, so perhaps we should either remove them there or add them here.

      await this.setLastSynced(channel, requestedAt);
    }
  }

  async exportAndPush(model) {
    for (const channel of await model.getChannels()) {
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
        await model.update(
          { markedForPush: false },
          {
            where: {
              id: records.map(r => r.data.id),
            },
          },
        );
      };

      let after = null;
      do {
        const records = await exportRecords(after);
        after = records[records.length - 1] || null;
        if (records.length > 0) {
          log.debug(`SyncManager.exportAndPush: pushing ${records.length} to sync server`);
          await this.remote.push(channel, records);
          await unmarkRecords(records);
        }
      } while (after !== null);

      log.debug(`SyncManager.exportAndPush: reached end of ${channel}`);
    }
  }

  async getLastSynced(channel) {
    const metadata = await this.context.models.SyncMetadata.findOne({ where: { channel } });
    return metadata?.lastSynced || 0;
  }

  async setLastSynced(channel, lastSynced) {
    await this.context.models.SyncMetadata.upsert({ channel, lastSynced });
  }

  async runSync() {
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

      models.Encounter,
    ];

    for (const model of modelsToSync) {
      if (shouldPull(model)) {
        await this.pullAndImport(model);
      }
      if (shouldPush(model)) {
        await this.exportAndPush(model);
      }
    }
  }
}
