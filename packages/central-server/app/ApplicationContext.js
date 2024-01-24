import { ReadSettings } from '@tamanu/settings';
import config from 'config';
import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase, initReporting } from './database';
import { initIntegrations } from './integrations';

export class ApplicationContext {
  store = null;

  reportSchemaStores = null;

  emailService = null;

  integrations = null;

  settings = null;

  closeHooks = [];

  async init({ testMode } = {}) {
    this.store = await initDatabase({ testMode });
    this.settings = new ReadSettings(this.store.models);
    this.emailService = new EmailService(this.settings);
    await this.emailService.init();
    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
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
