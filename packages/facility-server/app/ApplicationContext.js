import config from 'config';
import { omit } from 'lodash';
import { initBugsnag } from '@tamanu/shared/services/logging';
import { closeDatabase, initDatabase, initReporting } from './database';
import { VERSION } from './middleware/versionCompatibility.js';

export class ApplicationContext {
  sequelize = null;

  models = null;

  reportSchemaStores = null;

  closeHooks = [];

  async init({ appType } = {}) {
    if (config.errors?.enabled) {
      if (config.errors.type === 'bugsnag') {
        await initBugsnag({
          ...omit(config.errors, ['enabled', 'type']),
          appVersion: VERSION,
          appType,
        });
      }
    }

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
