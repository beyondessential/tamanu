import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class ContributingDeathCause extends Model {
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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHavePatientDeathData() {
            if (this.deletedAt) return;
            if (!this.patientDeathDataId) {
              throw new InvalidOperationError(
                'Cause of death must be attached to a PatientDeathData object.',
              );
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
    this.belongsTo(models.PatientDeathData, {
      foreignKey: 'patientDeathDataId',
      as: 'patientDeathData',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'conditionId',
      as: 'condition',
    });
  }
}
