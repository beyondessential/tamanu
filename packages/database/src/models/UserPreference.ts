import { DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class UserPreference extends Model {
  id!: string;
  key!: string;
  value!: Record<string, any>;
  userId?: string;

  static initModel(options: InitOptions) {
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
          type: DataTypes.JSONB,
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

  static async getAllPreferences(userId: string) {
    const userPreferences = await UserPreference.findAll<UserPreference>({
      where: { userId },
    });

    const allPreferences: Record<string, any> = {};

    for (const userPreference of userPreferences) {
      allPreferences[userPreference.key] = userPreference.value;
    }

    return allPreferences;
  }

  static initRelations(models: Models) {
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
