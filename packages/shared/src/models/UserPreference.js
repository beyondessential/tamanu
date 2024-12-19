import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init(options) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS (user_id) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        userId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        preferences: {
          type: DataTypes.JSONB,
        },
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        ...options,
      },
    );
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
