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

  async receiveAndImport(model, channel, since) {
    log.info(`SyncManager.receiveAndImport: syncing ${channel} (last: ${since})`);
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
      // receive
      log.debug(`SyncManager.receiveAndImport: receiving page ${page} of ${channel}`);
      const result = await this.remote.receive(channel, { page, since });
      const syncRecords = result.records;
      requestedAt = requestedAt === null ? requestedAt : Math.min(requestedAt, result.requestedAt);
      lastCount = syncRecords.length;
      if (lastCount === 0) {
        log.debug(`SyncManager.receiveAndImport: reached end of ${channel}`);
        break;
      }

      // import
      log.debug(
        `SyncManager.receiveAndImport: importing ${syncRecords.length} ${model.name} records`,
      );
      await importRecords(syncRecords);

      page++;
    } while (lastCount);

    // TODO: retry foreign key failures?

    return requestedAt;
  }

  async runSync() {
    const { models } = this.context;
    for (const [model, channel] of [[models.ReferenceData, 'reference']]) {
      const since = 0; // TODO: store this somewhere as lastSynced and retrieve it
      await this.receiveAndImport(model, channel, since);
    }
  }
}
