import config from 'config';
import { isSyncTriggerDisabled } from '@tamanu/shared/dataMigrations';
import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase, initReporting } from './database';
import { initIntegrations } from './integrations';
import { log } from '@tamanu/shared/services/logging';
import { defineSingletonTelegramBotService } from './services/TelegramBotService';

export class ApplicationContext {
  store = null;

  reportSchemaStores = null;

  emailService = null;

  telegramBotService = null;

  integrations = null;

  closeHooks = [];

  async init({ testMode } = {}) {
    this.emailService = new EmailService();

    this.store = await initDatabase({ testMode });
    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
    }

    this.telegramBotService = await defineSingletonTelegramBotService({
      apiToken: config.telegramBot.apiToken,
      language: config.language,
      models: this.store.models,
      webhook: config.telegramBot.webhook,
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
