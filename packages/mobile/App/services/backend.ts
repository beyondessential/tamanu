import { isCalculated } from '/helpers/fields';
import { dummyPrograms } from '~/dummyData/programs';
import { Database } from '~/infra/db';
import { needsInitialPopulation, populateInitialData } from '~/infra/db/populate';

import { SyncManager, DummySyncSource } from '~/services/sync';

export class Backend {

  constructor() {
    const { models } = Database;
    this.models = models;
    this.syncManager = new SyncManager(new DummySyncSource());

    this.pollInterval = 0.1 * 60 * 1000;
  }

  async initialise() {
    await Database.connect();
    this.startSyncService();
  }

  startSyncService() {
    this.interval = setInterval(() => {
      this.syncManager.runScheduledSync();
    }, this.pollInterval);
  }

  stopSyncService() {
    if(!this.interval) {
      return;
    }
    clearInterval(this.interval);
  }
}
