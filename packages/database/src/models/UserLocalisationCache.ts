import { DataTypes, Sequelize, type NonNullFindOptions } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class UserLocalisationCache extends Model {
  declare id: string;
  declare localisation: string;
  declare userId?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        localisation: {
          type: DataTypes.STRING,
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

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static async getLocalisation(options: NonNullFindOptions<any>) {
    const localisationCache = await this.findOne(options);
    if (!localisationCache) {
      return null;
    }
    return JSON.parse(localisationCache.localisation);
  }
}
