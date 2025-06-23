import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ProcedureTypeSurvey extends Model {
  declare id: string;
  declare procedureTypeId?: string;
  declare surveyId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
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
