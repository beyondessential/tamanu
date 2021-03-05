import { log } from '~/logging';

import { createImportPlan, executeImportPlan } from './import';

export class SyncManager {
  host = '';

  token = '';

  context = null;

  constructor(context, remote) {
    this.context = context;
    this.remote = remote;
  }

  async pullAndImport(model, channel) {
    const since = await this.getLastSynced(channel);
    log.info(`SyncManager.pullAndImport: syncing ${channel} (last: ${since})`);

    const plan = createImportPlan(model);
    const importRecords = async syncRecords => {
      for (const syncRecord of syncRecords) {
        await executeImportPlan(plan, syncRecord);
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
      log.debug(`SyncManager.pullAndImport: importing ${syncRecords.length} ${model.name} records`);
      await importRecords(syncRecords);

      page++;
    } while (lastCount);

    // TODO: retry foreign key failures?
    // Right now, our schema doesn't have any cycles in it, so neither retries nor stubs are strictly necessary.
    // However, they're implemented on mobile, so perhaps we should either remove them there or add them here.

    await this.setLastSynced(channel, requestedAt);
    return requestedAt;
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
    const syncJobs = [
      [models.ReferenceData, 'reference'],
      [models.User, 'user'],

      [models.ScheduledVaccine, 'scheduledVaccine'],

      [models.Program, 'program'],
      [models.Survey, 'survey'],
      [models.ProgramDataElement, 'programDataElement'],
      [models.SurveyScreenComponent, 'surveyScreenComponent'],

      [models.Patient, 'patient'],
    ];
    for (const [model, channel] of syncJobs) {
      // import
      await this.receiveAndImport(model, channel);
    }
  }
}
