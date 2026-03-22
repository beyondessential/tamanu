import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { dateType, type InitOptions, type Models } from '../types/model';

export class Template extends Model {
  declare id: string;
  declare name: string;
  declare dateCreated: string;
  declare title?: string;
  declare body?: string;
  declare type: string;
  declare visibilityStatus: string;
  declare createdById?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        dateCreated: dateType('dateCreated', {
          defaultValue: getCurrentDateString,
        }),
        title: {
          type: DataTypes.TEXT,
        },
        body: {
          type: DataTypes.TEXT,
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy',
    });
  }

  static getListReferenceAssociations() {
    return ['createdBy'];
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
