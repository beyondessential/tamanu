import { Sequelize, Op } from 'sequelize';
import { isPlainObject, get as getAtPath, set as setAtPath } from 'lodash';
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

function buildSettingsRecords(keyPrefix, value, facilityId) {
  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([k, v]) => buildSettingsRecords([keyPrefix, k].join('.'), v, facilityId))
      .flat();
  }
  return [{ key: keyPrefix, value: JSON.stringify(value), facilityId }];
}

export class Setting extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        key: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        value: Sequelize.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        // ideally would have a composite unique index here on key/facilityId, but prior to
        // postgres 15 there's no built in way to have NULL be meaningful in a unique constraint,
        // and facilityId is nullable
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  static async get(key = '', facilityId = null) {
    const settings = await Setting.findAll({
      where: {
        key: {
          [Op.startsWith]: key, // LIKE '{key}%'
        },
        facilityId,
      },
    });

    const settingsObject = {};
    for (const currentSetting of settings) {
      setAtPath(settingsObject, currentSetting.key, JSON.parse(currentSetting.value));
    }

    if (key === '') {
      return settingsObject;
    }

    // just return the object or value below the requested key
    // e.g. if schedules.outPatientDischarger was requested, the return object will look like
    // {  schedule: '0 11 * * *', batchSize: 1000 }
    // rather than
    // { schedules: { outPatientDischarger: { schedule: '0 11 * * *', batchSize: 1000 } } }
    return getAtPath(settingsObject, key);
  }

  static async forFacility(facilityId) {
    return this.get('', facilityId);
  }

  static async set(key, value, facilityId = null) {
    const records = buildSettingsRecords(key, value, facilityId);
    return Promise.all(
      records.map(async r => {
        // can't use upsert as there is no unique constraint on key/facilityId combo
        const existing = await this.findOne({
          where: { key: r.key, facilityId: r.facilityId },
        });
        if (existing) {
          await this.update({ value: r.value }, { where: { id: existing.id } });
        }
        await this.create(r);
      }),
    );
  }
}
