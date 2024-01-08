import config from 'config';
import { closeDatabase, initDatabase, initReporting } from './database';

export class ApplicationContext {
  sequelize = null;

  models = null;

  reportSchemaStores = null;

  closeHooks = [];

  async init() {
    const database = await initDatabase();
    this.sequelize = database.sequelize;
    this.models = database.models;

    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
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
