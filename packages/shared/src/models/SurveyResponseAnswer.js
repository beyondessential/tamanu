import config from 'config';
import { upperFirst } from 'lodash';
import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { InvalidOperationError } from '../errors';
import { runCalculations } from '../utils/calculations';
import { getStringValue } from '../utils/fields';

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

  // To be called after creating/updating a vitals survey response answer. Checks if
  // said answer is used in calculated questions and updates them accordingly.
  async upsertCalculatedQuestions(data) {
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error('upsertCalculatedQuestions must always run inside a transaction!');
    }
    const { models } = this.sequelize;
    const surveyResponse = await this.getSurveyResponse();
    const vitalsSurvey = await models.Survey.getVitalsSurvey();
    const isVitalSurvey = surveyResponse.surveyId === vitalsSurvey?.id;
    if (isVitalSurvey === false) {
      throw new InvalidOperationError(
        'upsertCalculatedQuestions must only be called with vitals answers',
      );
    }

    // Get necessary info and data shapes for running calculations
    const screenComponents = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponse.surveyId,
    );
    const calculatedScreenComponents = screenComponents.filter(c => c.calculation);
    const updatedAnswerDataElement = await this.getProgramDataElement();
    const answers = await surveyResponse.getAnswers();
    const values = {};
    answers.forEach(answer => {
      values[answer.dataElementId] = answer.body;
    });
    const calculatedValues = runCalculations(screenComponents, values);

    for (const component of calculatedScreenComponents) {
      if (component.calculation.includes(updatedAnswerDataElement.code) === false) {
        continue;
      }

      // Sanitize value
      const stringValue = getStringValue(
        component.dataElement.type,
        calculatedValues[component.dataElement.id],
      );
      const newCalculatedValue = stringValue ?? '';

      // Check if the calculated answer was created or not. It might've been missed
      // if no values used in its calculation were registered the first time.
      const existingCalculatedAnswer = answers.find(
        answer => answer.dataElementId === component.dataElement.id,
      );
      const previousCalculatedValue = existingCalculatedAnswer?.body;
      let newCalculatedAnswer;
      if (existingCalculatedAnswer) {
        await existingCalculatedAnswer.update({ body: newCalculatedValue });
      } else {
        newCalculatedAnswer = await models.SurveyResponseAnswer.create({
          dataElementId: component.dataElement.id,
          body: newCalculatedValue,
          responseId: surveyResponse.id,
        });
      }

      const { date, reasonForChange, user } = data;
      await models.VitalLog.create({
        date,
        reasonForChange,
        previousValue: previousCalculatedValue || null,
        newValue: newCalculatedValue,
        recordedById: user.id,
        answerId: existingCalculatedAnswer?.id || newCalculatedAnswer.id,
      });
    }
    return this;
  }
}
