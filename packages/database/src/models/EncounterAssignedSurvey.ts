import { DataTypes } from 'sequelize';
import { Model } from './Model';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import type { InitOptions, Models } from '../types/model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class EncounterAssignedSurvey extends Model {
  declare id: string;
  declare encounterId: string;
  declare surveyId: string;
  declare completed: boolean;

  static initModel({ primaryKey, ...options }: InitOptions, _models: Models) {
    super.init(
      {
        id: primaryKey,
        encounterId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'encounter_id',
        },
        surveyId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'survey_id',
        },
        completed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        tableName: 'encounter_assigned_surveys',
        timestamps: true,
        paranoid: true,
        underscored: true,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
      as: 'survey',
    });
  }

  static getListReferenceAssociations() {
    return ['encounter', 'survey'];
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

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
