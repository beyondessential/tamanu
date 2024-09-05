import config from 'config';
import { omit } from 'lodash';

import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase, initReporting } from './database';
import { initIntegrations } from './integrations';
import { defineSingletonTelegramBotService } from './services/TelegramBotService';
import { VERSION } from './middleware/versionCompatibility';

import { isSyncTriggerDisabled } from '@tamanu/shared/dataMigrations';
import { log, initBugsnag } from '@tamanu/shared/services/logging';
import { ReadSettings } from '@tamanu/settings/reader';

/**
 * @typedef {import('./services/EmailService').EmailService} EmailService
 * @typedef {import('@tamanu/settings').CentralReadSettings} SettingsReader
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

  /** @type {SettingsReader | null} */
  settings = null;

  closeHooks = [];

  async init({ testMode, appType } = {}) {
    if (config.errors?.enabled) {
      if (config.errors.type === 'bugsnag') {
        await initBugsnag({
          ...omit(config.errors, ['enabled', 'type']),
          appVersion: VERSION,
          appType,
        });
      }
    }

    this.emailService = new EmailService();

    this.store = await initDatabase({ testMode, dbKey: appType ?? 'main' });
    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
    }

    this.settings = new ReadSettings(this.store.models);

    this.settings.get('')
    this.telegramBotService = await defineSingletonTelegramBotService({
      config,
      models: this.store.models,
    });

    if (await isSyncTriggerDisabled(this.store.sequelize)) {
      log.warn('Sync Trigger is disabled in the database.');
      return null;
    }

    this.closePromise = new Promise(resolve => {
      this.onClose(resolve);
    });
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
