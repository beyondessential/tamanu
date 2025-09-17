import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class UserPreference extends Model {
  declare id: string;
  declare key: string;
  declare value: Record<string, any>;
  declare userId?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS ("user_id" || ';' || "key" || ';' || COALESCE("facility_id", '')) STORED`,
          primaryKey: true,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        // Adding this index to the model will break the upsert (https://github.com/sequelize/sequelize/issues/12595)
        // Since we dont use .sync() this is just for readability so just leaving as comment
        // indexes: [
        //   {
        //     fields: ['user_id', 'key', Sequilize.literal(`COALESCE(facility_id, '')`)],
        //     unique: true,
        //   },
        // ],
      },
    );
  }

  static async getAllPreferences(userId: string, facilityId: string) {
    const generalUserPreferences = await UserPreference.findAll<UserPreference>({
      where: { userId, facilityId: null },
    });

    const facilityUserPreferences = await UserPreference.findAll({
      where: { userId, facilityId },
    });

    const allPreferences: Record<string, any> = {};

    for (const userPreference of generalUserPreferences) {
      allPreferences[userPreference.key] = userPreference.value;
    }

    for (const userPreference of facilityUserPreferences) {
      allPreferences[userPreference.key] = userPreference.value;
    }

    return allPreferences;
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  static buildSyncFilter() {
    return null;
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
