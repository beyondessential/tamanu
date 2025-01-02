import { DataTypes } from 'sequelize';
import { CURRENTLY_AT_TYPES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ProgramRegistry extends Model {
  id!: string;
  code!: string;
  name!: string;
  currentlyAtType!: string;
  visibilityStatus!: string;
  programId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        currentlyAtType: {
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
        validate: {
          mustHaveValidCurrentlyAtType() {
            const values = Object.values(CURRENTLY_AT_TYPES);
            if (!values.includes(this.currentlyAtType as string)) {
              throw new InvalidOperationError(
                `The currentlyAtType must be one of ${values.join(', ')}`,
              );
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Program, {
      foreignKey: 'programId',
      as: 'program',
    });

    this.hasMany(models.ProgramRegistryClinicalStatus, {
      foreignKey: 'programRegistryId',
      as: 'clinicalStatuses',
    });

    this.hasMany(models.PatientProgramRegistration, {
      foreignKey: 'programRegistryId',
      as: 'patientProgramRegistrations',
    });

    this.hasMany(models.PatientProgramRegistrationCondition, {
      foreignKey: 'programRegistryId',
      as: 'patientProgramRegistrationConditions',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
