import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
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
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        indexes: [{ fields: ['user_id', 'key'], unique: true }],
      },
    );
  }

  static async getAllPreferences(userId) {
    const userPreferences = await UserPreference.findAll({
      where: { userId },
    });

    const allPreferences = {};

    for (const userPreference of userPreferences) {
      allPreferences[userPreference.key] = userPreference.value;
    }

    return allPreferences;
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static buildSyncFilter() {
    return null;
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
