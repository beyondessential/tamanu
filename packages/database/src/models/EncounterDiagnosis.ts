import { DataTypes } from 'sequelize';
import {
  DIAGNOSIS_CERTAINTY,
  DIAGNOSIS_CERTAINTY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class EncounterDiagnosis extends Model {
  declare id: string;
  declare certainty: string;
  declare isPrimary?: boolean;
  declare date: string;
  declare encounterId?: string;
  declare diagnosisId?: string;
  declare clinicianId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,

        certainty: {
          type: DataTypes.STRING,
          defaultValue: DIAGNOSIS_CERTAINTY.SUSPECTED,
          validate: {
            isIn: [DIAGNOSIS_CERTAINTY_VALUES], // application-level validation, not db-level
          },
        },
        isPrimary: DataTypes.BOOLEAN,
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

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'diagnosisId',
      as: 'Diagnosis',
    });
    this.belongsTo(models.User, {
      foreignKey: 'clinicianId',
      as: 'clinician',
    });
  }

  static getListReferenceAssociations() {
    return ['Diagnosis'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
