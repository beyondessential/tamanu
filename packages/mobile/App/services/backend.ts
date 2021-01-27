import { Database, ModelMap } from '~/infra/db';

import { SyncManager } from '~/services/sync';
import { WebSyncSource } from '~/services/syncSource';
import { readConfig, writeConfig } from '~/services/config';

const SYNC_PERIOD_MINUTES = 5;
const API_VERSION = 1;
const DEFAULT_SYNC_LOCATION = 'https://sync-dev.tamanu.io';

interface SyncConnectionParams {
  email: string;
  password: string;
  host: string;
}

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

  async connectToRemote(params: SyncConnectionParams): Promise<void> {
    console.log(params);
    const syncServerLocation = await readConfig('syncServerLocation');
    this.syncSource = new WebSyncSource(`${syncServerLocation}/v${API_VERSION}`);

    const { user, token } = await this.syncSource.login(params.email, params.password);
    console.log(user, token);

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
