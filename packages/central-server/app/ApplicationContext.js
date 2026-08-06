import config from 'config';
import { omit } from 'es-toolkit/compat';
import { Timesimp } from 'timesimp';

import { ReadSettings } from '@tamanu/settings';
import { BlobStore } from '@tamanu/database/blobStore';
import { isSyncTriggerDisabled } from '@tamanu/database/dataMigrations';
import { initBugsnag, log } from '@tamanu/shared/services/logging';
import { initReporting } from '@tamanu/database/services/reporting';
import {
  getFhirWorkerSettings,
  initFhirSettingsFromDb,
} from '@tamanu/shared/utils/fhir/fhirSettings';
import { setFhirRefreshTriggers } from '@tamanu/database';

import { EmailService } from './services/EmailService';

import { registerBlobReferenceSource } from './blobReferences';
import { closeDatabase, initDatabase } from './database';
import { initIntegrations } from './integrations';
import { AIService } from './services/AIService';
import { defineSingletonTelegramBotService } from './services/TelegramBotService';
import { VERSION } from './middleware/versionCompatibility';
import { initDeviceId } from '@tamanu/shared/utils';
import { DEVICE_TYPES } from '@tamanu/constants';

export const CENTRAL_SERVER_APP_TYPES = {
  API: 'api',
  FHIR_WORKER: 'fhir-worker',
  MAIN: 'main',
  MIGRATE: 'migrate',
  TASKS: 'tasks',
};

/**
 * @typedef {import('./services/EmailService').EmailService} EmailService
 * @typedef {import('@tamanu/settings/types').CentralSettingPath} CentralSettingPath
 * @typedef {import('@tamanu/settings').ReadSettings} ReadSettings
 */

export class ApplicationContext {
  /** @type {Awaited<ReturnType<typeof initDatabase>>|null} */
  store = null;

  reportSchemaStores = null;

  /** @type {EmailService | null} */
  emailService = null;

  /** @type {AIService | null} */
  aiService = null;

  /** @type {Awaited<ReturnType<typeof defineSingletonTelegramBotService>>|null} */
  telegramBotService = null;

  integrations = null;

  /**@type {ReadSettings<CentralSettingPath> | null} */
  settings = null;

  /** @type {BlobStore | null} */
  blobStore = null;

  /** @type {string | null} */
  deviceId = null;

  closeHooks = [];

  async init({ testMode, appType = CENTRAL_SERVER_APP_TYPES.MAIN, dbKey } = {}) {
    if (config.errors?.enabled) {
      if (config.errors.type === 'bugsnag') {
        await initBugsnag({
          ...omit(config.errors, ['enabled', 'type']),
          appVersion: [VERSION, process.env.REVISION].filter(Boolean).join('-'),
          appType,
        });
      }
    }

    this.store = await initDatabase({ testMode, dbKey: dbKey ?? appType });

    this.closePromise = new Promise(resolve => {
      this.onClose(resolve);
    });

    this.settings = new ReadSettings(this.store.models);

    // no need to set up services, integrations, etc. for migrations
    if (appType === CENTRAL_SERVER_APP_TYPES.MIGRATE) {
      return this;
    }

    // spec: CAS, CAP
    // No evictCache hook: central is the authoritative store, nothing is
    // evictable, so the free-disk floor refuses new blobs directly.
    this.blobStore = new BlobStore({
      root: await this.settings.get('blobStorage.root'),
      models: this.store.models,
      getFreeDiskReserveBytes: async () =>
        (await this.settings.get('blobStorage.freeDiskReserveGB')) * 1024 ** 3,
    });
    // spec: ATCH
    // Model and shared route code admits attachment content through this, so it
    // reaches the store from deep in an upstream write (a FHIR DiagnosticReport's
    // report PDF, a survey photo answer) with no request to carry it. Central is
    // the authoritative store, so admission is direct.
    this.store.sequelize.admitAttachmentBlob = (source, options) =>
      this.blobStore.put(source, options);

    // spec: ASSET, BLAC — assets reference blobs by hash; a facility's fetch of
    // an asset's bytes is authorised against the referencing asset row.
    registerBlobReferenceSource({ recordType: 'assets', hashColumn: 'hash' });

    await initFhirSettingsFromDb(this.settings);
    // Triggers follow the worker flag alone, not `fhir.enabled`: serving the HTTP routes and
    // running the materialisation worker switch independently, and the trigger is the only
    // thing that enqueues a refresh on an upstream update or delete. Gating it on the routes
    // too left the documented reporting-only deployment (routes off, worker on) materialising
    // new records but never refreshing changed ones.
    await setFhirRefreshTriggers(this.store.sequelize, {
      fhirWorkerEnabled: getFhirWorkerSettings().enabled,
    });

    await initDeviceId({ context: this, deviceType: DEVICE_TYPES.CENTRAL_SERVER });

    this.emailService = await EmailService.fromSettings(this.settings);

    try {
      this.reportSchemaStores = await initReporting(this.store);
    } catch (error) {
      // Reporting requires the app db role to manage the reporting roles (see
      // ensureReportingRole). On an under-provisioned database that fails; the
      // rest of the server works without reporting, so degrade instead of
      // crash-looping the whole deployment.
      log.error(
        'initReporting failed; reporting schemas unavailable until the db grants are fixed',
        { error },
      );
    }

    if (appType === CENTRAL_SERVER_APP_TYPES.API) {
      this.aiService = await AIService.init({
        settings: this.settings,
        models: this.store.models,
      });
    }

    this.telegramBotService = await defineSingletonTelegramBotService({
      models: this.store.models,
      settings: this.settings,
    });

    if (await isSyncTriggerDisabled(this.store.sequelize)) {
      log.warn('Sync Trigger is disabled in the database.');
      return null;
    }

    this.timesync = new Timesimp(
      async err => {
        if (err) throw err;
        // we assume central-server time is correct
        return 0;
      },
      async err => {
        if (err) throw err;
        // we assume central-server time is correct
      },
      async err => {
        if (err) throw err;
        throw new Error('No upstream timesync server for central');
      },
    );

    await initIntegrations(this);
    return this;
  }

  onClose(hook) {
    this.closeHooks.push(hook);
  }

  async close() {
    for (const hook of this.closeHooks) {
      await hook();
    }
    await closeDatabase();
  }

  async waitForClose() {
    return this.closePromise;
  }
}
