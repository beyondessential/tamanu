import { Database } from '../infra/db';
import { CentralServerConnection, MobileSyncManager } from './sync';
import { readConfig } from './config';
import { AuthService } from './auth';
import { AuthenticationError } from './error';
import { LocalisationService } from './localisation';
import { PermissionsService } from './permissions';
import { MODELS_MAP } from '../models/modelsMap';
import { SettingsService } from './settings';

const SYNC_PERIOD_MINUTES = 5;

export class BackendManager {
  randomId: any;

  responses: any[];

  initialised: boolean;

  models: typeof MODELS_MAP;

  syncManager: MobileSyncManager;

  centralServer: CentralServerConnection;

  auth: AuthService;

  localisation: LocalisationService;

  settings: SettingsService;

  permissions: PermissionsService;

  interval: NodeJS.Timeout;

  constructor() {
    const { models } = Database;
    this.models = models;
    this.centralServer = new CentralServerConnection();
    this.auth = new AuthService(models, this.centralServer);
    this.localisation = new LocalisationService(this.auth);
    this.settings = new SettingsService(this.auth);
    this.permissions = new PermissionsService(this.auth);
    this.syncManager = new MobileSyncManager(this.centralServer, this.settings);
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

    await this.syncManager.waitForCurrentSyncToEnd();

    const run = async (): Promise<void> => {
      try {
        // Don't start the sync service yet until the facility for the device is selected
        const facilityId = await readConfig('facilityId', '');
        if (facilityId) {
          await this.syncManager.triggerSync();
        }
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
    await this.syncManager.waitForCurrentSyncToEnd();
  }

  getSyncError(): any {
    return Database.syncError;
  }
}
