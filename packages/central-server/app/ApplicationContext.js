import config from 'config';
import { omit } from 'lodash';

import { ReadSettings } from '@tamanu/settings';
import { isSyncTriggerDisabled } from '@tamanu/shared/dataMigrations';
import { initBugsnag, log } from '@tamanu/shared/services/logging';

import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase, initReporting } from './database';
import { initIntegrations } from './integrations';
import { defineSingletonTelegramBotService } from './services/TelegramBotService';
import { VERSION } from './middleware/versionCompatibility';

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

  /** @type {Awaited<ReturnType<typeof defineSingletonTelegramBotService>>|null} */
  telegramBotService = null;

  integrations = null;

  /**@type {ReadSettings<CentralSettingPath> | null} */
  settings = null;

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

    this.emailService = new EmailService();

    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
    }

    this.telegramBotService = await defineSingletonTelegramBotService({
      config,
      models: this.store.models,
    });

    if (await isSyncTriggerDisabled(this.store.sequelize)) {
      log.warn('Sync Trigger is disabled in the database.');
      return null;
    }

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
