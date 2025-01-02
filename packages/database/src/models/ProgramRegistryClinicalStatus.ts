import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ProgramRegistryClinicalStatus extends Model {
  id!: string;
  code!: string;
  name!: string;
  color?: string;
  visibilityStatus!: string;
  programRegistryId!: string;

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
        color: DataTypes.TEXT,
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ProgramRegistry, {
      foreignKey: { name: 'programRegistryId', allowNull: false },
      as: 'programRegistry',
    });

    this.hasMany(models.PatientProgramRegistration, {
      foreignKey: 'clinicalStatusId',
      as: 'patientProgramRegistrations',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
