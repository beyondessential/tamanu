import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type InitOptions, type Models } from '../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
  buildEncounterLinkedSyncFilter,
} from '../sync';

export class ProcedureSurveyResponse extends Model {
  declare id: string;
  declare procedureId: string;
  declare surveyResponseId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        procedureId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'procedure_id',
        },
        surveyResponseId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'survey_response_id',
        },
      },
      {
        ...options,
        tableName: 'procedure_survey_responses',
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Procedure, {
      foreignKey: 'procedureId',
      as: 'procedure',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'surveyResponseId',
      as: 'surveyResponse',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'procedures', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['procedures', 'encounters']),
    };
  }
}
