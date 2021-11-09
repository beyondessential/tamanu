import { EmailService } from './services/EmailService';
import { initIntegrationServices } from './integrations';
import { initDatabase } from './database';

export class ApplicationContext {
  store = null;

  emailService = null;

  integrations = null;

  async init({ testMode } = {}) {
    this.emailService = new EmailService();
    this.store = await initDatabase({ testMode });
    this.integrations = initIntegrationServices(this);
    return this;
  }
}
