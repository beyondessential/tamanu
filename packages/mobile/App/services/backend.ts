import { Database, ModelMap } from '~/infra/db';
import {
  needsInitialPopulation,
  populateInitialData,
} from '~/infra/db/populate';

import { SyncManager } from '~/services/sync';
import { WebSyncSource } from '~/services/syncSource';

const SYNC_PERIOD_MINUTES = 5;

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: ModelMap;

  constructor() {
    const { models } = Database;
    this.models = models;
    const syncSource = new WebSyncSource('http://192.168.1.101:3000');
    this.syncManager = new SyncManager(syncSource);
  }

  async initialise(): Promise<void> {
    await Database.connect();
    this.startSyncService();
  }

  startSyncService() {
    // run once now, and then schedule for later
    this.syncManager.runScheduledSync();

    this.interval = setInterval(() => {
      this.syncManager.runScheduledSync();
    }, SYNC_PERIOD_MINUTES * 60 * 1000);
  }

  stopSyncService() {
    if(!this.interval) {
      return;
    }
    clearInterval(this.interval);
  }
}
