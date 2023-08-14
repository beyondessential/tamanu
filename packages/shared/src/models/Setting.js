import { Sequelize, Op } from 'sequelize';
import { isPlainObject, get as getAtPath, set as setAtPath } from 'lodash';
import { SYNC_DIRECTIONS, SETTINGS_SCOPES } from '@tamanu/constants';
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
export class Setting extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        key: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        value: Sequelize.JSONB,
        scope: Sequelize.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [
          {
            // settings_alive_key_unique_cnt
            // overly broad constraint, narrowed by the next two indices
            unique: true,
            fields: ['key', 'facility_id', 'deleted_at'],
          },
          {
            // settings_alive_key_unique_with_facility_idx
            unique: true,
            fields: ['key', 'facility_id'],
            where: { deleted_at: null, facility_id: { [Op.ne]: null } },
          },
          {
            // settings_alive_key_unique_without_facility_idx
            unique: true,
            fields: ['key'],
            where: { deleted_at: null, facility_id: null },
          },
        ],
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  /**
   * IMPORTANT: Duplicated from mobile/models/Setting.ts
   * Please update both places when modify
   */
  static async get(key = '', facilityId = null) {
    const settings = await Setting.findAll({
      where: {
        ...(key
          ? {
              key: {
                [Op.or]: {
                  [Op.eq]: key,
                  [Op.like]: `${key}.%`,
                },
              },
            }
          : {}),
        facilityId: {
          [Op.or]: {
            [Op.eq]: facilityId,
            [Op.is]: null,
          },
        },
      },

      // we want facility keys to come last so they override global keys
      order: [
        ['key', 'ASC'],
        [Sequelize.fn('coalesce', Sequelize.col('facility_id'), '###'), 'ASC'],
      ],
    });

    const settingsObject = {};
    for (const currentSetting of settings) {
      setAtPath(settingsObject, currentSetting.key, currentSetting.value);
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

  static async set(key, value, facilityId = null, scope = SETTINGS_SCOPES.GLOBAL) {
    const records = buildSettingsRecords(key, value, facilityId);

    // create or update records
    await Promise.all(
      records.map(async record => {
        // can't use upsert as sequelize can't parse our triple-index unique constraint
        const existing = await this.findOne({
          where: { key: record.key, facilityId: record.facilityId, scope },
        });

        if (existing) {
          await this.update({ value: record.value }, { where: { id: existing.id } });
        } else {
          await this.create({ ...record, scope });
        }
      }),
    );

    // delete any records that are no longer needed
    await this.update(
      {
        deletedAt: Sequelize.fn('now'),
      },
      {
        where: {
          ...(key && {
            key: {
              [Op.and]: {
                [Op.or]: {
                  [Op.eq]: key,
                  [Op.like]: `${key}.%`,
                },
                [Op.notIn]: records.map(r => r.key),
              },
            },
          }),
          facilityId,
          scope,
        },
      },
    );
  }

  static buildSyncFilter() {
    return `WHERE (facility_id = :facilityId OR scope = '${SETTINGS_SCOPES.GLOBAL}') AND ${this.tableName}.updated_at_sync_tick > :since`;
  }
}

export function buildSettingsRecords(keyPrefix, value, facilityId) {
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([k, v]) =>
      buildSettingsRecords([keyPrefix, k].filter(Boolean).join('.'), v, facilityId),
    );
  }
  return [{ key: keyPrefix, value, facilityId }];
}
