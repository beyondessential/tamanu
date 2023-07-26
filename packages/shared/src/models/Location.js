import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES, LOCATION_AVAILABILITY_STATUS } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';

export class Location extends Model {
  static init({ primaryKey, ...options }) {
    const validate = {
      mustHaveFacility() {
        if (!this.deletedAt && !this.facilityId) {
          throw new InvalidOperationError('A location must have a facility.');
        }
      },
    };
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        maxOccupancy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            isValidInt(value) {
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
        validate,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
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

  static formatFullLocationName({ locationGroup, name }) {
    return locationGroup ? `${locationGroup.name}, ${name}` : name;
  }

  static parseFullLocationName(text) {
    const {
      groups: { group, location },
    } = text.match(/(?<group>[^,]*(?=,\s))?(,\s)?(?<location>.*)/);
    return { group, location };
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
      where: { plannedLocationId: this.id, endDate: null },
    });
    if (plannedEncounters > 0) {
      return LOCATION_AVAILABILITY_STATUS.RESERVED;
    }
    return LOCATION_AVAILABILITY_STATUS.AVAILABLE;
  }
}
