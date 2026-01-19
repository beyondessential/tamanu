import config from 'config';
import { omit } from 'lodash';

import { initBugsnag } from '@tamanu/shared/services/logging';
import { ReadSettings } from '@tamanu/settings/reader';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { closeDatabase, initDatabase, initReporting } from './database';
import { VERSION } from './middleware/versionCompatibility.js';

/**
 * @typedef {import('@tamanu/settings/types').FacilitySettingPath} FacilitySettingPath
 * @typedef {import('@tamanu/settings').ReadSettings} ReadSettings
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('@tamanu/database/models')} Models
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

  async init({ appType, databaseOverrides } = {}) {
    if (config.errors?.enabled) {
      if (config.errors.type === 'bugsnag') {
        await initBugsnag({
          ...omit(config.errors, ['enabled', 'type']),
          appVersion: [VERSION, process.env.REVISION].filter(Boolean).join('-'),
          appType,
        });
      }
    }

    const facilityIds = selectFacilityIds(config);
    const database = await initDatabase(databaseOverrides);
    this.sequelize = database.sequelize;
    this.models = database.models;

    const { countryTimeZone } = config;
    this.settings = facilityIds.reduce((acc, facilityId) => {
      acc[facilityId] = new ReadSettings(this.models, {
        facilityId,
        countryTimeZone,
      });
      return acc;
    }, {});
    this.settings.global = new ReadSettings(this.models);
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
