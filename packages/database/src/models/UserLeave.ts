import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, dateType, type InitOptions, type Models } from '../types/model';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

export class UserLeave extends Model {
  declare id: string;
  declare startDate: string;
  declare endDate: string;
  declare userId: string;
  declare scheduledBy: string;
  declare scheduledAt: string;
  declare removedBy?: string;
  declare removedAt?: string;
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
        scheduledAt: dateTimeType('scheduledAt', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        removedAt: dateTimeType('removedAt', {
          allowNull: true,
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
    this.belongsTo(models.User, {
      foreignKey: 'scheduledBy',
      as: 'scheduledByUser',
    });
    this.belongsTo(models.User, {
      foreignKey: 'removedBy',
      as: 'removedByUser',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
