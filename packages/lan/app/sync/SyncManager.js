import { log } from '~/logging';
import { WebRemote } from './WebRemote';

export class SyncManager {
  host = '';

  token = '';

  context = null;

  constructor(context) {
    this.context = context;
    this.remote = new WebRemote(context);
    this.remote.connect();
  }

  async runSync() {
    // TODO: sync functionality
    const data = await this.remote.whoami();
    log.info(`Sync test - logged in as ${data.displayName}`);

    const referenceData = await this.remote.receive('reference');
    log.info(`Sync test - retrieved ${referenceData.length} ReferenceData records`);
  }
}
