import { upperFirst } from 'lodash';
import { DataTypes, Op } from 'sequelize';
import { AUDIT_REASON_KEY, SURVEY_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { InvalidOperationError } from '@tamanu/errors';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import { getStringValue } from '@tamanu/shared/utils/fields';
import type { InitOptions, ModelProperties, Models } from '../types/model';
import type { SessionConfig } from '../types/sync';
import type { User } from './User';
import type { SurveyResponse } from './SurveyResponse';
import type { ProgramDataElement } from './ProgramDataElement';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../sync/buildEncounterLinkedLookupFilter';

export class SurveyResponseAnswer extends Model {
  declare id: string;
  declare name?: string;
  declare body?: string;
  declare dataElementId?: string;
  declare responseId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: DataTypes.STRING,
        body: DataTypes.TEXT,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ProgramDataElement, {
      foreignKey: 'dataElementId',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'responseId',
      as: 'surveyResponse',
    });

    this.hasMany(models.VitalLog, {
      foreignKey: 'answerId',
      as: 'vitalLog',
    });
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
    if (patientCount === 0) {
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
          encounters.patient_id in (SELECT patient_id FROM ${markedForSyncPatientsTable})
        AND
          surveys.is_sensitive = FALSE
        AND
          ${this.tableName}.updated_at_sync_tick > :since
      `;
    }

    return `
      ${joins}
      WHERE
        encounters.patient_id in (SELECT patient_id FROM ${markedForSyncPatientsTable})
      AND
        ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, [
        {
          model: this.sequelize.models.SurveyResponse,
          joinColumn: 'response_id',
          required: true,
        },
        'encounters',
      ]),
    };
  }

  // eslint-disable-next-line no-unused-vars
  static getDefaultId = async (resource: string, settings: { get: (_arg0: string) => any }) => {
    const { models } = this.sequelize;
    const code = await settings.get(`survey.defaultCodes.${resource}`);

    const modelName = upperFirst(resource) as keyof Models;
    const model: typeof Model = models[modelName];
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    const record = await model.findOne({ where: { code } });
    if (!record) {
      throw new Error(
        `Could not find default answer for '${resource}': code '${code}' not found (check survey.defaultCodes.${resource} in the settings)`,
      );
    }
    return record.id;
  };

  // To be called after creating/updating a vitals survey response answer. Checks if
  // said answer is used in calculated questions and updates them accordingly.
  async upsertCalculatedQuestions(data: {
    date: string;
    reasonForChange: string;
    user: ModelProperties<User>;
    isVital: boolean;
  }) {
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error('upsertCalculatedQuestions must always run inside a transaction!');
    }
    const { models } = this.sequelize;
    const surveyResponse: SurveyResponse = await (this as any).getSurveyResponse();
    const isEditableSurvey = await models.Survey.findOne({
      where: {
        id: surveyResponse.surveyId,
        surveyType: {
          [Op.in]: [
            SURVEY_TYPES.VITALS,
            SURVEY_TYPES.SIMPLE_CHART,
            SURVEY_TYPES.COMPLEX_CHART,
          ],
        },
      },
    });
    if (!isEditableSurvey) {
      throw new InvalidOperationError(
        'upsertCalculatedQuestions must only be called with vitals or charting answers',
      );
    }

    // Get necessary info and data shapes for running calculations
    const screenComponents = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponse.surveyId!,
      { includeAllVitals: true },
    );
    const calculatedScreenComponents = screenComponents.filter(c => c.calculation);
    const updatedAnswerDataElement: ProgramDataElement = await (
      this as any
    ).getProgramDataElement();
    const answers: any[] = await (surveyResponse as any).getAnswers();
    const values: { [key: string]: any } = {};
    answers.forEach(answer => {
      values[answer.dataElementId] = answer.body;
    });
    const calculatedValues: Record<string, any> = runCalculations(screenComponents, values);

    const { date, reasonForChange, user, isVital } = data;
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
      let newCalculatedAnswer: SurveyResponseAnswer | null = null;
      if (existingCalculatedAnswer) {
        await existingCalculatedAnswer.updateWithReasonForChange(newCalculatedValue, reasonForChange);
      } else {
        newCalculatedAnswer = await models.SurveyResponseAnswer.create({
          dataElementId: component.dataElement.id,
          body: newCalculatedValue,
          responseId: surveyResponse.id,
        });
      }

      if (isVital) {
        await models.VitalLog.create({
          date,
          reasonForChange,
          previousValue: previousCalculatedValue || null,
          newValue: newCalculatedValue,
          recordedById: user.id,
          answerId: existingCalculatedAnswer?.id || newCalculatedAnswer?.id,
        });
      }
    }
    return this;
  }

  // This is to avoid affecting other audit logs that might be created in the same transaction
  async updateWithReasonForChange(newValue: string, reasonForChange: string) {
    if (reasonForChange) {
      await this.sequelize.setTransactionVar(AUDIT_REASON_KEY, reasonForChange);
    }
    await this.update({ body: newValue });
    await this.sequelize.setTransactionVar(AUDIT_REASON_KEY, null);
    return this;
  }
}
