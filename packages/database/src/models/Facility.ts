import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class Facility extends Model {
  id!: string;
  code!: string;
  name!: string;
  email?: string;
  contactNumber?: string;
  streetAddress?: string;
  cityTown?: string;
  division?: string;
  type?: string;
  visibilityStatus!: string;
  catchmentId?: string;

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

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
