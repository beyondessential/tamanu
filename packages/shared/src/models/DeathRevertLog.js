import { Sequelize, DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';

import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';

export class DeathRevertLog extends Model {
  static init(options) {
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

  static initRelations(models) {
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
}
