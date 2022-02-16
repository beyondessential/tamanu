import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class DeathCause extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        timeAfterOnset: {
          type: Sequelize.INTEGER, // minutes
          allowNull: false,
        },
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
        validate: {
          mustHavePatient() {
            if (this.deletedAt) return;
            if (!this.patientId) {
              throw new InvalidOperationError('Cause of death must have a patient.');
            }
          },
          mustHaveCondition() {
            if (this.deletedAt) return;
            if (!this.conditionId) {
              throw new InvalidOperationError('Cause of death must have a condition.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'conditionId',
    });
  }
}
