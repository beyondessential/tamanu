import { Database } from '../infra/db';
import { SyncManager, WebSyncSource } from './sync';
import { AuthService } from './auth';
import { AuthenticationError } from './error';
import { LocalisationService } from './localisation';
import { PermissionsService } from './permissions';
import { MODELS_MAP } from '../models/modelsMap';

const SYNC_PERIOD_MINUTES = 5;

export class Backend {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: typeof MODELS_MAP;

  syncManager: SyncManager;

  syncSource: WebSyncSource;

  auth: AuthService;

  localisation: LocalisationService;

  permissions: PermissionsService;

  interval: number;

  constructor() {
    const { models } = Database;
    this.models = models;
    this.syncSource = new WebSyncSource();
    this.auth = new AuthService(models, this.syncSource);
    this.localisation = new LocalisationService(this.auth);
    this.permissions = new PermissionsService(this.auth);
    this.syncManager = new SyncManager(this.syncSource, this.localisation);
  }

  async initialise(): Promise<void> {
    await Database.connect();
    await this.auth.initialise();
    await this.startSyncService();
  }

  async startSyncService(): Promise<void> {
    if (this.interval) {
      return; // already started
    }
    await this.syncManager.waitForEnd();

    const run = async (): Promise<void> => {
      try {
        await this.syncManager.runScheduledSync();
      } catch (e) {
        if (e instanceof AuthenticationError) {
          // expected - just log message
          console.log(`Auth failed while running sync (this is probably normal): ${e}`);
        } else {
          // unexpected - log the entire stack
          console.error(e.stack);
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
