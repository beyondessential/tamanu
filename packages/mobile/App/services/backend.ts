import { Database } from '~/infra/db';

import { SyncManager, WebSyncSource } from '~/services/sync';
import { readConfig, writeConfig } from '~/services/config';

import { IUser, SyncConnectionParameters } from '~/types';
import { MODELS_MAP } from '~/models/modelsMap';

const SYNC_PERIOD_MINUTES = 5;
const API_VERSION = 1;

function initSyncSource(server: string) {
  return new WebSyncSource(`${server}/v${API_VERSION}`)
}

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: typeof MODELS_MAP;

  syncManager: SyncManager;

  syncSource: WebSyncSource;

  interval: number;

  constructor() {
    const { models } = Database;
    this.models = models;
  }

  async initialise(): Promise<void> {
    await Database.connect();
    const server = await readConfig('syncServerLocation');
    if (server) {
      this.syncSource = initSyncSource(server);
    }
  }

  async connectToRemote(params: SyncConnectionParameters): Promise<{ user: IUser, token: string }> {
    // always use the server stored in config if there is one - last thing
    // we want is a device syncing down data from one server and then up
    // to another!
    const syncServerLocation = await readConfig('syncServerLocation');
    const server = syncServerLocation || params.server;

    // create the sync source and log in to it
    this.syncSource = initSyncSource(server);
    console.log(`Getting token from ${server}`);
    const { user, token } = await this.syncSource.login(params.email, params.password);
    console.log(`Signed in as ${user.displayName}`);

    if (!syncServerLocation) {
      // after a successful login, if we didn't already read the server from
      // stored config, write the one we did use to config
      writeConfig('syncServerLocation', params.server);
    }

    return { user, token };
  }

  startSyncService() {
    // TODO: this has a race condition and should await any ongoing sync
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
