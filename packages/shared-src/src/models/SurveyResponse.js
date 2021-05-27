import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

function riskCalculation(patient, getf, getb) {
  // TODO: this is probably wrong for sex === 'other', or other possible values
  const male = patient.sex?.code === 'male';
  const age = getf('NCDScreen5');

  const hdl = 1.55;
  const cholesterol = getf('NCDScreen12');
  const sbp = getf('NCDScreen6');
  const treatedHbp = false;
  const smoker = getb('NCDScreen9');
  const diabetes = getb('NCDScreen10');

  // from excel doc
  const M = male
    ? [44.88, 203.72, 44.75, 136.76, 0.1176, 0.63, 0.19, 0.916]
    : [45.16, 193.97, 43.99, 132.98, 0.1013, 0.47, 0.25, 0.931];
  const getM = idx => M[idx - 8];

  const COEFFS = male
    ? [3.06117, 1.1237, 0.93263, 1.93303, 1.99881, 0.65451, 0.57367]
    : [2.32888, 1.20904, 0.70833, 2.76157, 2.82263, 0.52873, 0.69154];
  const getCoeff = idx => COEFFS[idx - 8];

  /*
  =1-IF(C7=1,G15,H15)^EXP(
    IF(C7=1,J8,K8)*(LN(C8)-LN(IF(C7=1,G8,H8)))
    +IF(C7=1,J9,K9)*(LN(C9*38.67)-LN(IF(C7=1,G9,H9)))
    -IF(C7=1,J10,K10)*(LN(C10*38.67)-LN(IF(C7=1,G10,H10)))
    +IF(C12=1, IF(C7=1,J12,K12),IF(C7=1,J11,K11))*LN(C11)
    -IF(C7=1,J11,K11)*LN(IF(C7=1,G11,H11))*(1-IF(C7=1,G12,H12))
    -IF(C7=1,J12,K12)*LN(IF(C7=1,G11,H11))*IF(C7=1,G12,H12)
    +IF(C7=1,J13,K13)*(C13-IF(C7=1,G13,H13))
    +IF(C7=1,J14,K14)*(C14-IF(C7=1,G14,H14))
  )
  */

  const exp =
    getCoeff(8) * (Math.log(age) - Math.log(getM(8))) +
    getCoeff(9) * (Math.log(cholesterol * 38.67) - Math.log(getM(9))) -
    getCoeff(10) * (Math.log(hdl * 38.67) - Math.log(getM(10))) +
    (treatedHbp ? getCoeff(12) : getCoeff(11)) * Math.log(sbp) -
    getCoeff(11) * Math.log(getM(11)) * (1 - getM(12)) -
    getCoeff(12) * Math.log(getM(11)) * getM(12) +
    getCoeff(13) * ((smoker ? 1 : 0) - getM(13)) +
    getCoeff(14) * ((diabetes ? 1 : 0) - getM(14));

  const base = getM(15);
  const risk = 1 - (base ** Math.exp(exp));

  return risk;
}

export class SurveyResponse extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        startTime: { type: Sequelize.DATE, allowNull: true },
        endTime: { type: Sequelize.DATE, allowNull: true },
        result: { type: Sequelize.FLOAT, allowNull: true },
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

  static async runCalculations(patientId, surveyId, models, answersObject) {
    const patient = await models.Patient.findByPk(patientId);
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

      const getb = key => {
        const component = questions.find(x => x.dataElement.code === key);
        if (!component) return false;
        return !!answers[component.dataElement.id];
      };

      if (dataElement.type === 'Calculated') {
        // hardcoded BMI calculation
        return getf('NCDScreen13') / (getf('NCDScreen14') * getf('NCDScreen14'));
      }
      // hardcoded risk factor calculation
      return 100 * riskCalculation(patient, getf, getb);
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

  static async createWithAnswers(data) {
    const models = this.sequelize.models;
    const { answers, surveyId, patientId, ...responseData } = data;

    // ensure survey exists
    const survey = await models.Survey.findByPk(surveyId);
    if (!survey) {
      throw new InvalidOperationError(`Invalid survey ID: ${surveyId}`);
    }

    const { answers: calculatedAnswers, result } = await this.runCalculations(
      patientId,
      surveyId,
      models,
      answers,
    );

    const encounter = await this.getSurveyEncounter(models, survey, data);
    const record = await SurveyResponse.create({
      ...responseData,
      patientId,
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
      as: 'surveyResponse',
    });
  }
}
