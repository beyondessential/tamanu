import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase, initReporting } from './database';
import { initIntegrations } from './integrations';

export class ApplicationContext {
  store = null;

  reports = null;

  emailService = null;

  integrations = null;

  closeHooks = [];

  async init({ testMode } = {}) {
    this.emailService = new EmailService();
    this.store = await initDatabase({ testMode });
    this.reports = await initReporting();
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
