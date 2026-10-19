import { DataTypes } from 'sequelize';
import {
  SENSITIVE_NETWORK_IS_FIXED_MESSAGE,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Facility extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare email?: string;
  declare contactNumber?: string;
  declare streetAddress?: string;
  declare cityTown?: string;
  declare division?: string;
  declare type?: string;
  declare visibilityStatus: string;
  declare sensitiveNetworkId?: string;
  declare catchmentId?: string;

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
        email: DataTypes.STRING,
        contactNumber: DataTypes.STRING,
        streetAddress: DataTypes.STRING,
        cityTown: DataTypes.STRING,
        division: DataTypes.STRING,
        type: DataTypes.STRING,
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [
          { unique: true, fields: ['code'] },
          { unique: true, fields: ['name'] },
        ],
      },
    );

    // Incoming sync writes with hooks off, so a facility server still applies whatever central sends.
    // spec: specs/sync/sensitive-networks.md
    this.addHook('beforeUpdate', (facility: Facility) => {
      if (!facility.changed('sensitiveNetworkId')) return;
      throw new InvalidOperationError(
        `${SENSITIVE_NETWORK_IS_FIXED_MESSAGE} (facility ${facility.code ?? facility.id})`,
      );
    });
  }

  static initRelations(models: Models) {
    this.hasMany(models.Department, {
      foreignKey: 'facilityId',
    });
    this.hasMany(models.Location, {
      foreignKey: 'facilityId',
    });
    this.hasMany(models.UserFacility, {
      foreignKey: 'facilityId',
    });
    this.hasMany(models.PatientBirthData, {
      foreignKey: 'birthFacilityId',
    });
    this.hasMany(models.PatientProgramRegistration, {
      foreignKey: 'registeringFacilityId',
    });
    this.hasMany(models.PatientProgramRegistration, {
      foreignKey: 'facilityId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'catchmentId',
      as: 'catchment',
    });

    // A facility is sensitive exactly when this is set.
    this.belongsTo(models.SensitiveNetwork, {
      foreignKey: 'sensitiveNetworkId',
      as: 'sensitiveNetwork',
    });

    this.belongsToMany(models.User, {
      through: 'UserFacility',
    });

    this.belongsToMany(models.Patient, {
      through: 'PatientFacility',
      as: 'markedForSyncPatients',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
