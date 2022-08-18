import { Sequelize, Op } from 'sequelize';
import { isPlainObject } from 'lodash';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

/**
 * Stores nested settings data, where each leaf node in the nested object has a record in the table,
 * with a key based on the full path of keys to get there, joined by dots
 * The model is responsible for providing a nice interface, so that consumers don't have to think
 * about that storage mechanism, instead just setting and getting as they please
 * For e.g.:
 * Setting.set({
 *   schedules: {
 *     outpatientDischarger: {
 *       schedule: '0 11 * * *',
 *       batchSize: 1000,
 *     },
 *     automaticLabTestResultPublisher: false,
 *   },
 * });
 * becomes:
 * id    | key                                       | value
 * xxx   | schedules.outpatientDischarger.schedule   | 0 11 * * *
 * yyy   | schedules.outpatientDischarger.batchSize  | 1000
 * zzz   | schedules.automaticLabTestResultPublisher | false
 */

function buildSettingsRecords(keyPrefix, value) {
  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([k, v]) => buildSettingsRecords([keyPrefix, k].join('.'), v))
      .flat();
  }
  return [{ key: keyPrefix, value: JSON.stringify(value) }];
}

export class Setting extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        key: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        value: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      },
      {
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        ...options,
      },
    );
  }

  static async get(key = '') {
    const settings = await Setting.findAll({
      where: {
        key: {
          [Op.startsWith]: key, // LIKE '{key}%'
        },
      },
    });

    const settingsObject = {};

    for (const currentSetting of settings) {
      let target = settingsObject;
      const pathSegments = currentSetting.key.split('.');
      const finalSegment = pathSegments.pop();

      for (const segment of pathSegments) {
        if (!target[segment]) {
          target[segment] = {};
        }
        target = target[segment];
      }
      target[finalSegment] = JSON.parse(currentSetting.value);
    }

    if (key === '') {
      return settingsObject;
    }

    // just return the object or value below the requested key
    // e.g. if schedules.outPatientDischarger was requested, the return object will look like
    // {  schedule: '0 11 * * *', batchSize: 1000 }
    // rather than
    // { schedules: { outPatientDischarger: { schedule: '0 11 * * *', batchSize: 1000 } } }
    return key.split('.').reduce((object, index) => object[index], settingsObject);
  }

  static async set(key, value) {
    const records = buildSettingsRecords(key, value);
    return Promise.all(records.map(r => this.upsert(r)));
  }
}
