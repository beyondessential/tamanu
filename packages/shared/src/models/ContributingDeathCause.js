import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { InvalidOperationError } from '../errors';
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

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return `
      JOIN
        patient_death_data
      ON
        patient_death_data_id = patient_death_data.id
      WHERE
        patient_death_data.patient_id IN (:patientIds)
      AND
        contributing_death_causes.updated_at_sync_tick > :since
    `;
  }
}
