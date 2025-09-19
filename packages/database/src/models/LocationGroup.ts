import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES, LOCATION_BOOKABLE_VIEW } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { Facility } from './Facility';

export class LocationGroup extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare visibilityStatus: string;
  declare isBookable: string;
  declare facilityId?: string;
  declare facility?: Facility;

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
        isBookable: {
          type: DataTypes.STRING,
          defaultValue: LOCATION_BOOKABLE_VIEW.NO,
        },
      },
      {
        ...options,
        validate: {
          mustHaveFacility() {
            if (!this.deletedAt && !this.facilityId) {
              throw new InvalidOperationError('A location group must have a facility.');
            }
          },
          mustNotIncludeComma() {
            if ((this.name as string).includes(',')) {
              throw new InvalidOperationError('A location group name cannot include a comma.');
            }
          },
        },
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });

    this.hasMany(models.Location, {
      foreignKey: 'locationGroupId',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
