import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Department extends Model {
  id!: string;
  code!: string;
  name!: string;
  visibilityStatus!: string;
  departmentId?: string;
  facilityId?: string;

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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
