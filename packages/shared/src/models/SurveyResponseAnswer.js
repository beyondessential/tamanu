import config from 'config';
import { upperFirst } from 'lodash';
import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
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
    if (patientIds.length === 0) {
      return null;
    }

    // manually construct "joins", as survey_response join uses a non-conventional join column
    const joins = `
      JOIN survey_responses ON survey_response_answers.response_id = survey_responses.id
      JOIN encounters ON survey_responses.encounter_id = encounters.id
    `;

    // remove answers to sensitive surveys from mobile
    if (sessionConfig.isMobile) {
      return `
        ${joins}
        JOIN surveys ON survey_responses.survey_id = surveys.id
        WHERE
          encounters.patient_id in (:patientIds)
        AND
          surveys.is_sensitive = FALSE
        AND
          ${this.tableName}.updated_at_sync_tick > :since
      `;
    }

    return `
      ${joins}
      WHERE
        encounters.patient_id in (:patientIds)
      AND
        ${this.tableName}.updated_at_sync_tick > :since
    `;
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
