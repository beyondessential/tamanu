import config from 'config';
import { upperFirst } from 'lodash';
import { DataTypes, Op } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';

export class SurveyResponseAnswer extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: DataTypes.STRING,
        body: DataTypes.TEXT,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ProgramDataElement, {
      foreignKey: 'dataElementId',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'responseId',
      as: 'surveyResponse',
    });
  }

  static buildSyncFilter(patientIds, sessionConfig) {
    const baseFilter = buildEncounterLinkedSyncFilter(this, patientIds, sessionConfig, [
      'surveyResponse',
      'encounter',
    ]);
    if (baseFilter === null) {
      return null;
    }
    if (sessionConfig.isMobile) {
      // remove answers to sensitive surveys from mobile
      const where = {
        [Op.and]: [baseFilter.where, { '$surveyResponse.survey.is_sensitive$': false }],
      };

      // manually create include, silly amounts of complication to inject "survey" into the include
      // from baseFilter
      const include = [{ association: 'surveyResponse', include: ['encounter', 'survey'] }];

      return {
        where,
        include,
      };
    }
    return baseFilter;
  }

  static getDefaultId = async resource => {
    const code = config.survey.defaultCodes[resource];
    const modelName = upperFirst(resource);
    const model = this.sequelize.models[modelName];
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    const record = await model.findOne({ where: { code } });
    if (!record) {
      throw new Error(
        `Could not find default answer for '${resource}': code '${code}' not found (check survey.defaultCodes.${resource} in the config)`,
      );
    }
    return record.id;
  };
}
