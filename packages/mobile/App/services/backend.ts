import { isCalculated } from '/helpers/fields';
import { dummyPrograms } from '~/dummyData/programs';
import { Database } from '~/infra/db';
import { needsInitialPopulation, populateInitialData } from '~/infra/db/populate';

import { DummySyncSource } from '~/services/sync';

export class Backend {

  async initialise() {
    await Database.connect();
    const { models } = Database;
    this.models = models;
    this.syncSource = new DummySyncSource();

    this.pollInterval = 0.1 * 60 * 1000;
    this.startSyncService();
  }

  startSyncService() {
    this.interval = setInterval(() => {
      this.syncSource.runScheduledSync();
    }, this.pollInterval);
  }

  stopSyncService() {
    if(!this.interval) {
      return;
    }
    clearInterval(this.interval);
  }
}
