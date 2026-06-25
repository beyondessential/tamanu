import config from 'config';
import { omit } from 'es-toolkit/compat';

import { initReporting } from '@tamanu/database/services/reporting';
import { initBugsnag } from '@tamanu/shared/services/logging';
import { ReadSettings } from '@tamanu/settings/reader';

import { closeDatabase, initDatabase } from './database';
import { getServerFacilityIds, initServerConfig } from './serverConfig';
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

    this.store = await initDatabase(databaseOverrides);
    this.sequelize = this.store.sequelize;
    this.models = this.store.models;

    // Resolve the sync target/facilities from local system facts now the DB is up.
    await initServerConfig({ context: this });
    const facilityIds = getServerFacilityIds() ?? [];

    this.settings = facilityIds.reduce((acc, facilityId) => {
      acc[facilityId] = new ReadSettings(this.models, facilityId);
      return acc;
    }, {});
    this.settings.global = new ReadSettings(this.models);
    return this;
  }

  // Call after migrations: reporting reads its per-server secret from local_system_facts.
  async initReportingStores() {
    this.reportSchemaStores = await initReporting(this.store);
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
