import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Program extends Model {
  declare id: string;
  declare code?: string;
  declare name?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: DataTypes.STRING,
        name: DataTypes.STRING,
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations() {
    return [{ association: 'programRegistries' }];
  }

  static initRelations(models: Models) {
    this.hasMany(models.Survey, {
      as: 'surveys',
      foreignKey: 'programId',
    });

    this.hasMany(models.ProgramRegistry, {
      as: 'programRegistries',
      foreignKey: 'programId',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
