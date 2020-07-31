import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class SurveyResponse extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
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

    const encounter = await this.getSurveyEncounter(models, survey, data);
    const record = await super.create({
      ...responseData,
      surveyId,
      encounterId: encounter.id,
    });

    await record.createAnswers(answers);

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
