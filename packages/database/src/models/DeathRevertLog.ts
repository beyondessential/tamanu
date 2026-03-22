import { DataTypes, Sequelize } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';

import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class DeathRevertLog extends Model {
  declare id: string;
  declare revertTime: Date;
  declare deathDataId: string;
  declare patientId?: string;
  declare revertedById?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
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

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
