import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';

import { Model } from './Model';

export class UserPreference extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        selectedGraphedVitalsOnFilter: Sequelize.STRING,
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
