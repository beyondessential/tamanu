import { log } from '~/logging';
import { Source } from './Source';

export class SyncManager {
  host = '';

  token = '';

  context = null;

  constructor(context) {
    this.context = context;
    this.source = new Source(context);
  }

  async runSync() {
    // TODO: sync functionality
    const response = await this.source.fetch('whoami');
    const data = await response.json();
    log.info(`Sync test - logged in as ${data.displayName}`);
  }
}
