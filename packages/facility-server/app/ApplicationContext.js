import config from 'config';
import { omit } from 'lodash';

import { initReporting } from '@tamanu/database/services/reporting';
import { initBugsnag } from '@tamanu/shared/services/logging';
import { ReadSettings } from '@tamanu/settings/reader';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { initFhirSettingsFromDb } from '@tamanu/shared/utils/fhir/fhirSettings';
import { setFhirRefreshTriggers } from '@tamanu/database';

import { closeDatabase, initDatabase } from './database';
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

  /** @type {Promise<void> | null} */
  closePromise = null;

  async init({ appType, databaseOverrides, dbKey } = {}) {
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
    const key = dbKey ?? appType ?? 'main';
    this.store = await initDatabase(databaseOverrides ?? {}, key);
    this.sequelize = this.store.sequelize;
    this.closePromise = new Promise(resolve => {
      this.onClose(resolve);
    });
    this.models = this.store.models;

    this.settings = facilityIds.reduce((acc, facilityId) => {
      acc[facilityId] = new ReadSettings(this.models, facilityId);
      return acc;
    }, {});
    this.settings.global = new ReadSettings(this.models);

    const triggersEnabled =
      !!config?.integrations?.fhir?.enabled && !!config?.integrations?.fhir?.worker?.enabled;

    const facilityReaders = facilityIds.map(id => this.settings[id]);
    await initFhirSettingsFromDb(this.settings.global, facilityReaders);
    await setFhirRefreshTriggers(this.sequelize, { triggersEnabled });

    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting(this.store);
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

  async waitForClose() {
    return this.closePromise;
  }
}
