import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class SurveyResponse extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        startTime: { type: Sequelize.DATE, allowNull: false },
        endTime: { type: Sequelize.DATE, allowNull: false },
        result: Sequelize.FLOAT,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Survey, {
      foreignKey: 'surveyId',
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
  }

  static async getSurveyEncounter(models, survey, data) {
    const { encounterId, patientId } = data;

    if (encounterId) {
      return models.Encounter.findByPk(encounterId);
    }

    if (!patientId) {
      throw new InvalidOperationError(
        'A survey response must have an encounter or patient ID attached',
      );
    }

    const { Encounter } = models;

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

    const { departmentId, examinerId, locationId } = data;

    // need to create a new encounter
    return Encounter.create({
      patientId,
      encounterType: 'surveyResponse',
      reasonForEncounter: `Survey response: ${survey.name}`,
      departmentId,
      examinerId,
      locationId,
      startDate: Date.now(),
      endDate: Date.now(),
    });
  }

  static async runCalculations(surveyId, models, answersObject) {
    const questions = await models.SurveyScreenComponent.getComponentsForSurvey(surveyId);

    const calculatedAnswers = {};
    let result = null;

    const calculatedFieldTypes = ['Calculated', 'Result'];
    const runCalculation = (dataElement, answers) => {
      // TODO: parse calculation arithmetic from fields & use arithmetic module
      const getf = key => {
        const component = questions.find(x => x.dataElement.code === key);
        if (!component) return NaN;
        return parseFloat(answers[component.dataElement.id]);
      };

      if (dataElement.type === 'Calculated') {
        // hardcoded BMI calculation
        return getf('NCDScreen13') / (getf('NCDScreen14') * getf('NCDScreen14'));
      }
      // hardcoded risk factor calculation
      return 1000 + getf('NCDScreen13') / (getf('NCDScreen14') * getf('NCDScreen14'));
    };

    questions
      .filter(q => calculatedFieldTypes.includes(q.dataElement.type))
      .map(({ dataElement }) => {
        const answer = runCalculation(dataElement, answersObject);
        calculatedAnswers[dataElement.id] = answer;
        if (dataElement.type === 'Result') {
          result = answer;
        }
      });

    return {
      result,
      answers: calculatedAnswers,
    };
  }

  async createAnswers(answersObject) {
    const answerKeys = Object.keys(answersObject);
    if (answerKeys.length === 0) {
      throw new InvalidOperationError('At least one answer must be provided');
    }

    await Promise.all(
      answerKeys.map(ak =>
        this.sequelize.models.SurveyResponseAnswer.create({
          dataElementId: ak,
          responseId: this.id,
          body: answersObject[ak],
        }),
      ),
    );
  }

  static async create(data) {
    const models = this.sequelize.models;
    const { answers, surveyId, ...responseData } = data;

    // ensure survey exists
    const survey = await models.Survey.findByPk(surveyId);
    if (!survey) {
      throw new InvalidOperationError(`Invalid survey ID: ${surveyId}`);
    }

    const { answers: calculatedAnswers, result } = await this.runCalculations(
      surveyId,
      models,
      answers,
    );

    const encounter = await this.getSurveyEncounter(models, survey, data);
    const record = await super.create({
      ...responseData,
      surveyId,
      encounterId: encounter.id,
      result,
    });

    await record.createAnswers({
      ...answers,
      ...calculatedAnswers,
    });

    return record;
  }
}

export class SurveyResponseAnswer extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: Sequelize.STRING,
        body: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ProgramDataElement, {
      foreignKey: 'dataElementId',
    });

    this.belongsTo(models.SurveyResponse, {
      foreignKey: 'responseId',
    });
  }
}
