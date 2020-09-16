<<<<<<< HEAD
import { isCalculated } from '/helpers/fields';
import { dummyPrograms } from '~/dummyData/programs';
import { Database } from '~/infra/db';
import { needsInitialPopulation, populateInitialData } from '~/infra/db/populate';
=======
import { Database, ModelMap } from '~/infra/db';
import {
  needsInitialPopulation,
  populateInitialData,
} from '~/infra/db/populate';
>>>>>>> dev

import { SyncManager, DummySyncSource } from '~/services/sync';

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: ModelMap;

  constructor() {
    const { models } = Database;
    this.models = models;
    this.syncManager = new SyncManager(new DummySyncSource());

    this.pollInterval = 0.1 * 60 * 1000;
  }

  async initialise(): Promise<void> {
    await Database.connect();
<<<<<<< HEAD
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
=======
    const { models } = Database;
    if (await needsInitialPopulation(models)) {
      await populateInitialData(models);
    }
  }
>>>>>>> dev
}
