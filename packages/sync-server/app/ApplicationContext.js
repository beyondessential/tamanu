import { ReadSettings } from '@tamanu/settings';
import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase } from './database';
import { initIntegrations } from './integrations';

export class ApplicationContext {
  store = null;

  emailService = null;

  integrations = null;

  settings = null;

  closeHooks = [];

  async init({ testMode } = {}) {
    this.emailService = new EmailService();
    this.store = await initDatabase({ testMode });
    this.settings = new ReadSettings(this.store.models);
    this.closePromise = new Promise(resolve => {
      this.onClose(resolve);
    });
    await initIntegrations(this);
    return this;
  }

  onClose(hook) {
    this.closeHooks.push(hook);
  }

  close = async () => {
    for (const hook of this.closeHooks) {
      await hook();
    }
    await closeDatabase();
  };

  async waitForClose() {
    return this.closePromise;
  }
}
