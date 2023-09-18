import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class UserLocalisationCache extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        localisation: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [{ fields: ['user_id'], unique: true }],
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static async getLocalisation(options) {
    const localisationCache = await this.findOne(options);
    if (!localisationCache) {
      return null;
    }
    return JSON.parse(localisationCache.localisation);
  }
}
