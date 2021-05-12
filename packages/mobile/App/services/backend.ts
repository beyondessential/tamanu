import { Database } from '~/infra/db';
import { SyncManager, WebSyncSource } from '~/services/sync';
import { AuthService } from '~/services/auth';
import { AuthenticationError } from '~/services/auth/error';
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
    await this.startSyncService();
  }

  async startSyncService() {
    if (this.interval) {
      return; // already started
    }
    await this.stopSyncService();

    const run = async () => {
      try {
        await this.syncManager.runScheduledSync();
      } catch (e) {
        if (e instanceof AuthenticationError) {
          // expected - just log
          console.log(`Auth failed while running sync (this is probably normal): ${e}`);
        } else {
          // unexpected - log and throw
          console.error(e.stack);
          throw e;
        }
      }
    };

    // run once now, and then schedule for later
    run();
    this.interval = setInterval(run, SYNC_PERIOD_MINUTES * 60 * 1000);
  }

  async stopSyncService(): Promise<void> {
    if (!this.interval) {
      return; // not started
    }
    clearInterval(this.interval);
    this.interval = null;
    await this.syncManager.waitForEnd();
  }
}
