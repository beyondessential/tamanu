import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase } from './database';
import { initIntegrations } from './integrations';

export class ApplicationContext {
  store = null;

  emailService = null;

  integrations = null;

  closeHooks = [];

  async init({ testMode } = {}) {
    this.emailService = new EmailService();
    this.store = await initDatabase({ testMode });
    this.onClose(async () => await closeDatabase());
    await initIntegrations(this);
    return this;
  }

  onClose(hook) {
    this.closeHooks.push(hook);
  }

  close() {
    this.closeHooks.forEach(hook => hook());
  }

  async close() {
    await Promise.all(this.closeHooks.map(async hook => hook()));
  }
}
