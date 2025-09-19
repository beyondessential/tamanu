import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateType, type InitOptions, type Models } from '../types/model';

export class UserLeave extends Model {
  declare id: string;
  declare startDate: string;
  declare endDate: string;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        startDate: dateType('startDate', {
          allowNull: false,
        }),
        endDate: dateType('endDate', {
          allowNull: false,
        }),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
