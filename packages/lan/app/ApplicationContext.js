import config from 'config';
import { closeDatabase, initDatabase, initReporting } from './database';

export class ApplicationContext {
  sequelize = null;

  models = null;

  reports = null;

  closeHooks = [];

  async init() {
    const database = await initDatabase();
    this.sequelize = database.sequelize;
    this.models = database.models;

    if (config.db.reports?.enabled) {
      this.reports = await initReporting();
    }
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
}
