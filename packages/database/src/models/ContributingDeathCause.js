import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return `
      JOIN
        patient_death_data
      ON
        patient_death_data_id = patient_death_data.id
      WHERE
        patient_death_data.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND
        contributing_death_causes.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'patient_death_data.patient_id',
      }),
      joins: `
        JOIN
          patient_death_data
        ON
          patient_death_data_id = patient_death_data.id
      `,
    };
  }
}
