import { Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          // User preference records use a user_id as the primary key, acting as a
          // db-level enforcement of one per user, and simplifying sync
          type: `TEXT GENERATED ALWAYS AS ("user_id")`,
          set() {
            // any sets of the convenience generated "id" field can be ignored, so do nothing here
          },
        },
        selectedGraphedVitalsOnFilter: Sequelize.STRING,
        userId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'users',
            key: 'id',
          },
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }
}
