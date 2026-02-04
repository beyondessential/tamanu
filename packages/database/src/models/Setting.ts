import { DataTypes, Op, Sequelize } from 'sequelize';
import { isPlainObject, get as getAtPath, set as setAtPath, isEqual, keyBy } from 'lodash';
import { settingsCache } from '@tamanu/settings/cache';
import { SYNC_DIRECTIONS, SETTINGS_SCOPES } from '@tamanu/constants';
import { extractDefaults, getScopedSchema } from '@tamanu/settings/schema';
import { getConfigSecret, encryptSecret } from '@tamanu/shared/utils/crypto';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';
import type { SettingPath } from '@tamanu/settings/types';

const SETTINGS_SCOPES_VALUES = Object.values(SETTINGS_SCOPES);

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
  declare id: string;
  declare key: string;
  declare value?: Record<string, any>;
  declare scope: string;
  declare facilityId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        key: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        value: DataTypes.JSONB,
        scope: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: SETTINGS_SCOPES.GLOBAL,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        hooks: {
          afterSave() {
            settingsCache.reset();
          },
          afterBulkCreate() {
            settingsCache.reset();
          },
          afterBulkUpdate() {
            settingsCache.reset();
          },
          afterBulkDestroy() {
            settingsCache.reset();
          },
        },
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
            fields: ['key', 'scope'],
            where: { deleted_at: null, facility_id: null },
          },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  /**
   * IMPORTANT: Duplicated from mobile/models/Setting.ts
   * Please update both places when modify
   */
  static async get(
    key: SettingPath | '' = '',
    facilityId: string | null = null,
    scopeOverride: (typeof SETTINGS_SCOPES_VALUES)[number] | null = null,
  ) {
    const determineScope = () => {
      if (scopeOverride) {
        return scopeOverride;
      }
      if (facilityId) {
        return SETTINGS_SCOPES.FACILITY;
      }
      return null;
    };
    const scope = determineScope();
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
        ...(scope
          ? {
              scope,
            }
          : {}),
        facilityId: {
          ...(facilityId ? { [Op.eq]: facilityId } : { [Op.is]: null }),
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

  static async set(
    key: SettingPath | '' = '',
    value: object,
    scope: (typeof SETTINGS_SCOPES_VALUES)[number] = SETTINGS_SCOPES.GLOBAL,
    facilityId: string | null = null,
  ) {
    const records = buildSettingsRecords(key, value, facilityId, scope);
    const schema = getScopedSchema(scope);
    const defaultsForScope = extractDefaults(schema);

    const existingSettings = await this.findAll({
      where: {
        key: records.map(r => r.key),
        scope,
        facilityId,
      },
      paranoid: false,
    });

    const existingByKey = keyBy(existingSettings, 'key');

    await Promise.all(
      records.map(async record => {
        const existing = existingByKey[record.key];
        if (existing) {
          if (existing.deletedAt) {
            await this.restore({ where: { id: existing.id } });
          }
          if (!isEqual(existing.value, record.value)) {
            // only update existing records that have changed
            await this.update({ value: record.value }, { where: { id: existing.id } });
          }
        } else {
          // only create records for values that differ from the defaults
          if (!isEqual(record.value, getAtPath(defaultsForScope, record.key))) {
            await this.create(record);
          }
        }
      }),
    );

    const keyWhere = key
      ? {
          [Op.or]: {
            [Op.eq]: key,
            [Op.like]: `${key}.%`,
          },
        }
      : {};

    // delete any records that are no longer needed
    await this.update(
      {
        deletedAt: Sequelize.fn('now'),
      },
      {
        where: {
          key: {
            [Op.and]: {
              ...keyWhere,
              [Op.notIn]: records.map(r => r.key),
            },
          },
          scope,
          facilityId,
        },
      },
    );
  }

  static buildSyncFilter() {
    return `WHERE (facility_id in (:facilityIds) OR scope = '${SETTINGS_SCOPES.GLOBAL}') AND ${this.tableName}.updated_at_sync_tick > :since`;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        facilityId: 'settings.facility_id',
      }),
    };
  }

  /**
   * Sets an encrypted secret in the settings table.
   */
  static async setSecret(
    name: string,
    value: string,
    scope: (typeof SETTINGS_SCOPES_VALUES)[number] = SETTINGS_SCOPES.GLOBAL,
    facilityId: string | null = null,
  ): Promise<void> {
    const psk = await getConfigSecret('crypto.settingsPsk');
    const keyBuffer = Buffer.from(psk, 'base64');
    const encryptedValue = await encryptSecret(keyBuffer, value);
    await this.set(name as SettingPath, encryptedValue as unknown as object, scope, facilityId);
  }
}

function buildSettingsRecords(
  keyPrefix: string,
  value: object,
  facilityId: string | null,
  scope: (typeof SETTINGS_SCOPES_VALUES)[number] = SETTINGS_SCOPES.GLOBAL,
): { key: string; value: object; facilityId: string | null; scope: string }[] {
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([k, v]) =>
      buildSettingsRecords([keyPrefix, k].filter(Boolean).join('.'), v, facilityId, scope),
    );
  }
  return [{ key: keyPrefix, value, facilityId, scope }];
}
