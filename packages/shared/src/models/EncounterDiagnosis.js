import { Sequelize } from 'sequelize';
import {
  SYNC_DIRECTIONS,
  DIAGNOSIS_CERTAINTY,
  DIAGNOSIS_CERTAINTY_VALUES,
} from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class EncounterDiagnosis extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        certainty: {
          type: Sequelize.STRING,
          defaultValue: DIAGNOSIS_CERTAINTY.SUSPECTED,
          isIn: DIAGNOSIS_CERTAINTY_VALUES, // application-level validation, not db-level
        },
        isPrimary: Sequelize.BOOLEAN,
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveDiagnosis() {
            if (!this.diagnosisId) {
              throw new Error('An encounter diagnosis must be attached to a diagnosis.');
            }
          },
          mustHaveEncounter() {
            if (!this.encounterId) {
              throw new Error('An encounter diagnosis must be attached to an encounter.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'diagnosisId',
      as: 'Diagnosis',
    });
  }

  static getListReferenceAssociations() {
    return ['Diagnosis'];
  }

  static buildPatientSyncFilter(patientIds) {
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'encounters']);
  }
}
