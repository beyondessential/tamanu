import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// Confidential data that has already synced to a facility cannot be recalled, and data a facility
// recorded before joining a network already exists elsewhere in the deployment. So a facility's
// network is fixed when the facility is created: it cannot be set later, cleared, or repointed.
// spec: specs/sync/sensitive-networks.md
export const SENSITIVE_NETWORK_IS_FIXED_MESSAGE =
  'a facility cannot change sensitive network, only a new facility can be enrolled in a network';

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
        validate: {
          // Covers every path that writes a facility through a loaded instance: the reference data
          // import, and provisioning's own facilities block. Two paths are deliberately outside it,
          // and both have to stay that way.
          //
          // Migrations write through raw SQL, so no validator runs. The schema card's backfill
          // enrols existing sensitive facilities, which is exactly the transition refused here — a
          // CHECK constraint or trigger would block it.
          //
          // Incoming sync writes through `Model.update(values, { where })` (see saveChanges.ts),
          // which validates against `this.build(values)` — a fake instance with isNewRecord true.
          // The isNewRecord check below is what lets that through, and it is load-bearing: once the
          // backfill has run centrally, facility rows carrying a network sync down to facility
          // servers that still hold them with none. Widening this guard to catch bulk updates would
          // break sync on every one of them.
          sensitiveNetworkIsFixed() {
            if (this.isNewRecord) return;
            if (!this.changed('sensitiveNetworkId')) return;
            throw new InvalidOperationError(
              `${SENSITIVE_NETWORK_IS_FIXED_MESSAGE} (facility ${this.code ?? this.id})`,
            );
          },
        },
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
