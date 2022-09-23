import { EmailService } from './services/EmailService';
import { closeDatabase, initDatabase } from './database';
import { initIntegrations } from './integrations';

export class ApplicationContext {
  store = null;

  emailService = null;

  integrations = null;

  async init({ testMode } = {}) {
    this.emailService = new EmailService();
    this.store = await initDatabase({ testMode });
    await initIntegrations(this);
    return this;
  }
}
