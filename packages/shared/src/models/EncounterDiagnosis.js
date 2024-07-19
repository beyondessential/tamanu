import { Sequelize } from 'sequelize';
import {
  DIAGNOSIS_CERTAINTY,
  DIAGNOSIS_CERTAINTY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';
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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupFilter() {
    return {
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'encounters']),
      patientIdTables: ['encounters'],
    };
  }
}
