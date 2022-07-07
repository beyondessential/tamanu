import config from 'config';
import { upperFirst } from 'lodash';
import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class SurveyResponseAnswer extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
        body: Sequelize.TEXT,
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
