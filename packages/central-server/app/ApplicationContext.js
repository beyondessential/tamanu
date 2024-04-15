import config from 'config';
import { omit } from 'lodash';
import { isSyncTriggerDisabled } from '@tamanu/shared/dataMigrations';
import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase, initReporting } from './database';
import { initIntegrations } from './integrations';
import { TelegramBotService } from './services/TelegramBotService';
import { log, initBugsnag } from '@tamanu/shared/services/logging';
import { VERSION } from './middleware/versionCompatibility';

export class ApplicationContext {
  store = null;

  reportSchemaStores = null;

  emailService = null;

  telegramBotService = null;

  integrations = null;

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
    this.telegramBotService = new TelegramBotService();
    this.store = await initDatabase({ testMode, dbKey: appType ?? 'main' });
    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
    }

    if (await isSyncTriggerDisabled(this.store.sequelize)) {
      log.warn("Sync Trigger is disabled in the database.");
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
