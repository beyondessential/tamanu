import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';

import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class DeathRevertLog extends Model {
  id!: string;
  revertTime!: Date;
  deathDataId!: string;
  patientId?: string;
  revertedById?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
        },
        revertTime: dateTimeType('revertTime', { allowNull: false }),
        deathDataId: { type: DataTypes.STRING, allowNull: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
        validate: {
          mustHavePatient() {
            if (!this.patientId) {
              throw new InvalidOperationError('A death revert log must have a patient.');
            }
          },
          mustHaveValidUser() {
            if (!this.revertedById) {
              throw new InvalidOperationError(
                'A death revert log must register the user that triggered the revert.',
              );
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'revertedById',
      as: 'revertedBy',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
