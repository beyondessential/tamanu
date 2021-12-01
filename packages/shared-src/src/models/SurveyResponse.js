import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';
import { runCalculations } from '../utils/calculations';

const handleSurveyResponseActions = async (models, actions, questions, patientId) => {
  const actionQuestions = questions
    .filter(q => q.dataElement.type === 'PatientIssue')
    .filter(({ dataElement }) => Object.keys(actions).includes(dataElement.id));

  for (const question of actionQuestions) {
    const { dataElement, config: configString } = question;
    switch (dataElement.type) {
      case 'PatientIssue': {
        const config = JSON.parse(configString) || {};
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
      default:
      // pass
    }
  }
};

function getResultValue(components, values) {
  const resultComponents = components.filter(c => c.dataElement.type === 'Result');
  // @TODO perform checkVisiblityCriteria

  const component = resultComponents.pop();

  if (!component) {
    return { result: 0, resultText: '' };
  }

  const rawValue = values[component.dataElement.id];

  if (rawValue === undefined || rawValue === null || Number.isNaN(rawValue)) {
    return { result: 0, resultText: component.detail || '' };
  }

  if (typeof rawValue === 'string') {
    return { result: 0, resultText: rawValue };
  }

  return {
    result: rawValue,
    resultText: `${rawValue.toFixed(0)}%`,
  };
}

function getStringValue(type, value) {
  switch (type) {
    case 'Calculated':
      return value.toFixed(1);
    default:
      return `${value}`;
  }
}

export class SurveyResponse extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        startTime: { type: Sequelize.DATE, allowNull: true },
        endTime: { type: Sequelize.DATE, allowNull: true },
        result: { type: Sequelize.FLOAT, allowNull: true },
        resultText: { type: Sequelize.TEXT, allowNull: true },
      },
      options,
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
    const models = this.sequelize.models;
    const { answers, actions, surveyId, patientId, encounterId, ...responseData } = data;

    // ensure survey exists
    const survey = await models.Survey.findByPk(surveyId);
    if (!survey) {
      throw new InvalidOperationError(`Invalid survey ID: ${surveyId}`);
    }

    const questions = await models.SurveyScreenComponent.getComponentsForSurvey(surveyId);

    await handleSurveyResponseActions(models, actions, questions, patientId);

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
      ...responseData,
      patientId,
      surveyId,
      encounterId: encounter.id,
      result,
      resultText,
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
        dataElement: dataElement.id,
        body,
        responseId: record.id,
      });
    }

    return record;
  }
}
