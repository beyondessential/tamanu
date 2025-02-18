import config from 'config';
import { omit } from 'lodash';
import {create as createTimesync} from 'timesync';

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

  async init({ appType } = {}) {
    if (config.errors?.enabled) {
      if (config.errors.type === 'bugsnag') {
        await initBugsnag({
          ...omit(config.errors, ['enabled', 'type']),
          appVersion: [VERSION, process.env.REVISION].filter(Boolean).join('-'),
          appType,
        });
      }
    }

    console.log('setting ts')

    this.ts = createTimesync({
      server: `${config.sync.host.trim().replace(/\/*$/, '')}/timesync`,
      interval: 4000,
    });
    this.ts.on('change', (offset) => {
      console.log('Time offset changed to', offset);
      console.log('Now timestamp', new Date(this.ts.now()).getTime())
    });


    const facilityIds = selectFacilityIds(config);
    const database = await initDatabase();
    this.sequelize = database.sequelize;
    this.models = database.models;
    this.settings = facilityIds.reduce((acc, facilityId) => {
      acc[facilityId] = new ReadSettings(this.models, facilityId);
      return acc;
    }, {});
    if (config.db.reportSchemas?.enabled) {
      this.reportSchemaStores = await initReporting();
    }
    return this;
  }

  onClose(hook) {
    this.closeHooks.push(hook);
  }

  async close() {
    this.ts.destroy();
    for (const hook of this.closeHooks) {
      await hook();
    }
    await closeDatabase();
  }
}
