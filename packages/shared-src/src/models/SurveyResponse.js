import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import {
  ACTION_DATA_ELEMENT_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  SYNC_DIRECTIONS,
} from 'shared/constants';
import { EncounterLinkedModel } from './EncounterLinkedModel';
import { runCalculations } from '../utils/calculations';
import { getStringValue, getResultValue } from '../utils/fields';

const handleSurveyResponseActions = async (models, actions, questions, answers, patientId) => {
  const actionQuestions = questions
    .filter(q => ACTION_DATA_ELEMENT_TYPES.includes(q.dataElement.type))
    .filter(({ dataElement }) => Object.keys(actions).includes(dataElement.id));

  for (const question of actionQuestions) {
    const { dataElement, config: configString } = question;
    const config = JSON.parse(configString) || {};
    switch (dataElement.type) {
      case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE: {
        if (!config.issueNote || !config.issueType)
          throw new InvalidOperationError(
            `Ill-configured PatientIssue with config: ${configString}`,
          );
        await models.PatientIssue.create({
          patientId,
          type: config.issueType,
          note: config.issueNote,
        });
        break;
      }
      case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA: {
        if (config.writeToPatient) {
          if (!config.writeToPatient.fieldName) {
            throw new Error('No fieldName defined for writeToPatient config');
          }
          const patient = await models.Patient.findOne({
            where: { id: patientId },
            include: [
              {
                model: models.PatientAdditionalData,
                as: 'additionalData',
              },
            ],
          });
          const additionalData = patient?.additionalData?.[0];
          if (config.writeToPatient.isAdditionalDataField) {
            if (!additionalData) {
              throw new Error(`Unable to find additionalData for patientId ${patientId}`);
            }
            additionalData[config.writeToPatient.fieldName] = answers[dataElement.id];
            await additionalData.save();
          } else {
            if (!patient) {
              throw new Error(`Unable to find patient for id ${patientId}`);
            }
            patient[config.writeToPatient.fieldName] = answers[dataElement.id];
            await patient.save();
          }
        }
        break;
      }
      default:
      // pass
    }
  }
};

export class SurveyResponse extends EncounterLinkedModel {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        startTime: { type: Sequelize.DATE, allowNull: true },
        endTime: { type: Sequelize.DATE, allowNull: true },
        result: { type: Sequelize.FLOAT, allowNull: true },
        resultText: { type: Sequelize.TEXT, allowNull: true },
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        ...options,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
      as: 'survey',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasMany(models.SurveyResponseAnswer, {
      foreignKey: 'responseId',
      as: 'answers',
    });

    this.hasOne(models.Referral, {
      foreignKey: 'surveyResponseId',
      as: 'referral',
    });
  }

  static async getSurveyEncounter({ encounterId, patientId, reasonForEncounter, ...responseData }) {
    const { Encounter } = this.sequelize.models;

    if (encounterId) {
      return Encounter.findByPk(encounterId);
    }

    if (!patientId) {
      throw new InvalidOperationError(
        'A survey response must have an encounter or patient ID attached',
      );
    }

    // find open encounter
    const openEncounter = await Encounter.findOne({
      where: {
        patientId,
        endDate: null,
      },
    });

    if (openEncounter) {
      return openEncounter;
    }

    const { departmentId, examinerId, locationId } = responseData;

    // need to create a new encounter
    return Encounter.create({
      patientId,
      encounterType: 'surveyResponse',
      reasonForEncounter,
      departmentId,
      examinerId,
      locationId,
      startDate: Date.now(),
      endDate: Date.now(),
    });
  }

  static async createWithAnswers(data) {
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error('SurveyResponse.createWithAnswers must always run inside a transaction!');
    }
    const { models } = this.sequelize;
    const { answers, actions, surveyId, patientId, encounterId, ...responseData } = data;

    // ensure survey exists
    const survey = await models.Survey.findByPk(surveyId);
    if (!survey) {
      throw new InvalidOperationError(`Invalid survey ID: ${surveyId}`);
    }

    const questions = await models.SurveyScreenComponent.getComponentsForSurvey(surveyId);

    await handleSurveyResponseActions(models, actions, questions, answers, patientId);

    const calculatedAnswers = runCalculations(questions, answers);
    const finalAnswers = {
      ...answers,
      ...calculatedAnswers,
    };

    const { result, resultText } = getResultValue(questions, answers);

    const encounter = await this.getSurveyEncounter({
      encounterId,
      patientId,
      reasonForEncounter: `Survey response for ${survey.name}`,
      ...responseData,
    });
    const record = await SurveyResponse.create({
      patientId,
      surveyId,
      encounterId: encounter.id,
      result,
      resultText,
      // put responseData last to allow for user to override
      // resultText by including it in the data
      // this is used by reports test where the resultText
      // is included in the payload
      ...responseData,
    });

    const findDataElement = id => {
      const component = questions.find(c => c.dataElement.id === id);
      if (!component) return null;
      return component.dataElement;
    };
    for (const a of Object.entries(finalAnswers)) {
      const [dataElementId, value] = a;
      const dataElement = findDataElement(dataElementId);
      if (!dataElement) {
        throw new Error(`no data element for question: ${dataElementId}`);
      }
      const body = getStringValue(dataElement.type, value);
      await models.SurveyResponseAnswer.create({
        dataElementId: dataElement.id,
        body,
        responseId: record.id,
      });
    }

    return record;
  }
}
