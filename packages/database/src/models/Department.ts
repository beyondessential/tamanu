import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Department extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare visibilityStatus: string;
  declare departmentId?: string;
  declare facilityId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        validate: {
          mustHaveFacility() {
            if (!this.deletedAt && !this.facilityId) {
              throw new InvalidOperationError('A department must have a facility.');
            }
          },
        },
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.Encounter, {
      foreignKey: 'departmentId',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
