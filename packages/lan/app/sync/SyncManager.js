import { SYNC_DIRECTIONS } from 'shared/constants';
import { log } from '~/logging';
import { createImportPlan, executeImportPlan } from './import';

const shouldPull = model =>
  model.syncDirection === SYNC_DIRECTIONS.READ_ONLY ||
  model.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;

const shouldPush = model =>
  model.syncDirection === SYNC_DIRECTIONS.WRITE_ONLY ||
  model.syncDirection === SYNC_DIRECTIONS.BIDIRECTIONAL;

export class SyncManager {
  host = '';

  token = '';

  context = null;

  constructor(context, remote) {
    this.context = context;
    this.remote = remote;
  }

  async pullAndImport(model) {
    const channel = model.channel();
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
    const modelsToSync = Object.values(models).filter(
      m => m.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC,
    );
    for (const model of modelsToSync) {
      if (shouldPull(model)) {
        await this.pullAndImport(model);
      }
      if (shouldPush(model)) {
        // TODO: implement exportAndPush
        log.warn('exportAndPush not implement yet');
      }
    }
  }
}
