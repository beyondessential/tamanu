import config from 'config';
import { omit } from 'es-toolkit/compat';
import { Timesimp } from 'timesimp';

import { ReadSettings } from '@tamanu/settings';
import { isSyncTriggerDisabled } from '@tamanu/database/dataMigrations';
import { initBugsnag, log } from '@tamanu/shared/services/logging';
import { initReporting } from '@tamanu/database/services/reporting';
import {
  getFhirWorkerSettings,
  initFhirSettingsFromDb,
} from '@tamanu/shared/utils/fhir/fhirSettings';
import { setFhirRefreshTriggers } from '@tamanu/database';

import { EmailService } from './services/EmailService';

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

  /** @type {(typeof CENTRAL_SERVER_APP_TYPES)[keyof typeof CENTRAL_SERVER_APP_TYPES] | null} */
  appType = null;

  /** @type {Awaited<ReturnType<typeof defineSingletonTelegramBotService>>|null} */
  telegramBotService = null;

  integrations = null;

  /**@type {ReadSettings<CentralSettingPath> | null} */
  settings = null;

  /** @type {string | null} */
  deviceId = null;

  closeHooks = [];

  async init({ testMode, appType = CENTRAL_SERVER_APP_TYPES.MAIN, dbKey } = {}) {
    this.appType = appType;
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

    await this.refreshAiService();

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

  // API app only. Rebuilt rather than mutated: init already resolves every
  // enabled/key/model combination, including having no service at all.
  async refreshAiService() {
    if (this.appType !== CENTRAL_SERVER_APP_TYPES.API) return;
    this.aiService = await AIService.init({
      settings: this.settings,
      models: this.store.models,
    });
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
