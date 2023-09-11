import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';

export class ProgramRegistryClinicalStatus extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        color: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ProgramRegistry, {
      foreignKey: 'programRegistryId',
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
}
