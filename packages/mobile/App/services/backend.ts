import { Database } from '~/infra/db';
import { SyncManager, WebSyncSource } from '~/services/sync';
import { AuthService } from '~/services/auth';
import { MODELS_MAP } from '~/models/modelsMap';

const SYNC_PERIOD_MINUTES = 5;

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: typeof MODELS_MAP;

  syncManager: SyncManager;

  syncSource: WebSyncSource;

  auth: AuthService;

  interval: number;

  constructor() {
    const { models } = Database;
    this.models = models;
    this.syncSource = new WebSyncSource();
    this.syncManager = new SyncManager(this.syncSource);
    this.auth = new AuthService(models, this.syncSource);
  }

  async initialise(): Promise<void> {
    await Database.connect();
    await this.auth.initialise();
  }

  startSyncService() {
    this.stopSyncService();

    // run once now, and then schedule for later
    this.syncManager.runScheduledSync();

    this.interval = setInterval(() => {
      this.syncManager.runScheduledSync();
    }, SYNC_PERIOD_MINUTES * 60 * 1000);
  }

  stopSyncService(): void {
    // TODO: this has a race condition and should await any ongoing sync
    if (!this.interval) {
      return;
    }
    clearInterval(this.interval);
    this.interval = null;
  }
}
