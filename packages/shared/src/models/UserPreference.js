import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [{ fields: ['user_id', 'key', 'facilityId'], unique: true }],
        ...options,
      },
    );
  }

  static async getAllPreferences(userId, facilityId) {
    const userPreferences = await UserPreference.findAll({
      where: { userId },
    });

    const userFacilityPreferences = await UserPreference.findAll({
      where: { userId, facilityId },
    });

    const allPreferences = {};

    for (const userPreference of userPreferences) {
      allPreferences[userPreference.key] = userPreference.value;
    }
    for (const userPreference of userFacilityPreferences) {
      allPreferences[userPreference.key] = userPreference.value;
    }

    return allPreferences;
  }

  static initRelations(models) {
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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
