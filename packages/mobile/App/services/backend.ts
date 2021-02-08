import { Database, ModelMap } from '~/infra/db';

import { SyncManager } from '~/services/sync';
import { WebSyncSource } from '~/services/syncSource';
import { readConfig, writeConfig } from '~/services/config';

import { SyncConnectionParameters } from '~/types/SyncConnectionParameters';

const SYNC_PERIOD_MINUTES = 5;
const API_VERSION = 1;
const DEFAULT_SYNC_LOCATION = 'https://sync-dev.tamanu.io';

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: ModelMap;

  syncManager: SyncManager;

  syncSource: WebSyncSource;

  interval: number;

  constructor() {
    const { models } = Database;
    this.models = models;
  }

  async initialise(): Promise<void> {
    await Database.connect();
  }

  async connectToRemote(params: SyncConnectionParameters): Promise<void> {
    // always use the server stored in config if there is one - last thing
    // we want is a device syncing down data from one server and then up
    // to another!
    const syncServerLocation = await readConfig('syncServerLocation');
    const server = syncServerLocation || params.server;

    // create the sync source and log in to it
    this.syncSource = new WebSyncSource(`${server}/v${API_VERSION}`);
    console.log(`Getting token from ${server}`);
    const { user, token } = await this.syncSource.login(params.email, params.password);
    console.log(`Signed in as ${user.displayName}`);

    if(!syncServerLocation) {
      // after a successful login, if we didn't already read the server from
      // stored config, write the one we did use to config
      writeConfig('syncServerLocation', params.server);
    }

    this.startSyncService();

    return { user, token };
  }

  startSyncService(syncServerLocation: string) {
    this.stopSyncService();

    this.syncManager = new SyncManager(this.syncSource);

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
    this.syncManager = null;
  }
}
