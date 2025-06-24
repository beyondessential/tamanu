import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { DataTypes } from 'sequelize';

export class ProcedureTypeSurvey extends Model {
  declare id: string;
  declare procedureTypeId?: string;
  declare surveyId?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS (REPLACE("procedure_type_id", ';', ':') || ';' || REPLACE("survey_id", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        procedureTypeId: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
        surveyId: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        uniqueKeys: {
          procedure_type_survey_unique: {
            fields: ['procedure_type_id', 'survey_id'],
          },
        },
      } as any,
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'procedureTypeId',
      as: 'procedureType',
    });
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
      as: 'survey',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
