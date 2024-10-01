import config from 'config';
import { omit } from 'lodash';
import { initBugsnag } from '@tamanu/shared/services/logging';
import { closeDatabase, initDatabase, initReporting } from './database';
import { VERSION } from './middleware/versionCompatibility.js';
import { ReadSettings } from '@tamanu/settings/reader';

/**
 * @typedef {import('@tamanu/settings/types').FacilitySettingPath} FacilitySettingPath
 * @typedef {import('@tamanu/settings').ReadSettings} ReadSettings
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('@tamanu/shared/models')} Models
 */

export class ApplicationContext {
  /** @type {Sequelize | null} */
  sequelize = null;

  /** @type {Models | null} */
  models = null;

  /**
   * @type {ReadSettings<FacilitySettingPath> | null}
   */
  settings = null;

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
    this.settings = new ReadSettings(this.models, config.serverFacilityId);
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
