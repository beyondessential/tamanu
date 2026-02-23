import { DataTypes } from 'sequelize';
import {
  LOCATION_AVAILABILITY_STATUS,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { Facility } from './Facility';
import type { LocationGroup } from './LocationGroup';

export class Location extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare visibilityStatus: string;
  declare maxOccupancy?: number;
  declare facilityId?: string;
  declare locationGroupId?: string;
  declare deletedAt?: Date;
  declare facility?: Facility;
  declare locationGroup?: LocationGroup;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        maxOccupancy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            isValidInt(value: number) {
              if (value && value !== 1) {
                // Currently max occupancy above 1 is unimplemented
                throw new InvalidOperationError(
                  'A location must have a max occupancy of 1 or null for unrestricted occupancy.',
                );
              }
            },
          },
        },
      },
      {
        ...options,
        validate: {
          mustHaveFacility() {
            if (!this.deletedAt && !this.facilityId) {
              throw new InvalidOperationError('A location must have a facility.');
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
      foreignKey: 'locationId',
    });

    this.hasMany(models.Procedure, {
      foreignKey: 'locationId',
    });

    this.hasMany(models.ImagingRequest, {
      foreignKey: 'locationId',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });

    this.belongsTo(models.LocationGroup, {
      foreignKey: 'locationGroupId',
      as: 'locationGroup',
    });

    this.hasMany(models.Encounter, {
      foreignKey: 'plannedLocationId',
      as: 'plannedMoves',
    });
  }

  static formatFullLocationName({ locationGroup, name }: Location) {
    return locationGroup ? `${locationGroup.name}, ${name}` : name;
  }

  // Parses "group, location" or "location". Uses a non-backtracking regex to avoid ReDoS.
  static parseFullLocationName(text: string) {
    const match = text.match(/^(?:(?<group>[^,]*)(,\s))?(?<location>.*)$/);
    const group = match?.groups?.group;
    const location = match?.groups?.location;
    return {
      group: group !== undefined && group !== '' ? group : undefined,
      location: location ?? '',
    };
  }

  async getAvailability() {
    const { Encounter } = this.sequelize.models;
    /**
     * If a locations maxOccupancy is null there is no limit to the number of patients that can be assigned
     * to location, there will be no warnings and the location will always be available.
     */
    if (this.maxOccupancy === null) return LOCATION_AVAILABILITY_STATUS.AVAILABLE;

    const openEncounters = await Encounter.count({
      where: { locationId: this.id, endDate: null },
    });
    if (openEncounters > 0) {
      return LOCATION_AVAILABILITY_STATUS.OCCUPIED;
    }

    const plannedEncounters = await Encounter.count({
      where: {
        plannedLocationId: this.id,
        endDate: null,
      },
    });
    if (plannedEncounters > 0) {
      return LOCATION_AVAILABILITY_STATUS.RESERVED;
    }
    return LOCATION_AVAILABILITY_STATUS.AVAILABLE;
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
