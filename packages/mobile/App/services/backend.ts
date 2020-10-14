import { Database, ModelMap } from '~/infra/db';
import {
  needsInitialPopulation,
  populateInitialData,
} from '~/infra/db/populate';

import { SyncManager } from '~/services/sync';
import { WebSyncSource } from '~/services/syncSource';
import { readConfig } from '~/services/config';

const SYNC_PERIOD_MINUTES = 5;
const DEFAULT_SYNC_LOCATION = 'http://192.168.1.100:3000';

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: ModelMap;

  constructor() {
    const { models } = Database;
    this.models = models;
  }

  async initialise(): Promise<void> {
    const syncServerLocation = await readConfig('syncServerLocation', DEFAULT_SYNC_LOCATION);
    const syncSource = new WebSyncSource(syncServerLocation);
    this.syncManager = new SyncManager(syncSource);
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
