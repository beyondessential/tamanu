import { Sequelize } from 'sequelize';
import {
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
  LOCATION_AVAILABILITY_STATUS,
} from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
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
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
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

    this.hasMany(models.Encounter, {
      foreignKey: 'plannedLocationId',
      as: 'plannedMoves',
    });
  }

  async getAvailability() {
    const { Encounter } = this.sequelize.models;

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
