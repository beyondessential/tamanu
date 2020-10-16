import { Database, ModelMap } from '~/infra/db';

import { SyncManager } from '~/services/sync';
import { WebSyncSource } from '~/services/syncSource';
import { readConfig, writeConfig } from '~/services/config';

const SYNC_PERIOD_MINUTES = 5;
const DEFAULT_SYNC_LOCATION = 'https://sync-dev.tamanu.io';

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: ModelMap;

  syncManager: SyncManager;

  interval: number;

  constructor() {
    const { models } = Database;
    this.models = models;
  }

  async initialise(): Promise<void> {
    await Database.connect();

    const syncServerLocation = await readConfig('syncServerLocation', DEFAULT_SYNC_LOCATION);
    if(syncServerLocation) {
      this.startSyncService(syncServerLocation);
    }
  }

  startSyncService(syncServerLocation: string) {
    writeConfig('syncServerLocation', syncServerLocation);

    const syncSource = new WebSyncSource(syncServerLocation);
    this.syncManager = new SyncManager(syncSource);

    this.stopSyncService();

    // run once now, and then schedule for later
    this.syncManager.runScheduledSync();

    this.interval = setInterval(() => {
      this.syncManager.runScheduledSync();
    }, SYNC_PERIOD_MINUTES * 60 * 1000);
  }

  stopSyncService(): void {
    if (!this.interval) {
      return;
    }
    clearInterval(this.interval);
    this.interval = null;
  }
}
