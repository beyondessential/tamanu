import Chance from 'chance';
import { fake } from 'shared/test-helpers/fake';
import {
  SURVEY_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  VITALS_DATA_ELEMENT_IDS,
} from '@tamanu/constants/surveys';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { createTestContext } from '../utilities';

const chance = new Chance();
const TEST_VITALS_SURVEY_ID = 'vitals-survey-id-for-testing-purposes';
describe('SurveyResponseAnswer', () => {
  let app;
  let baseApp;
  let models;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('vitals', () => {
    let dataElements;
    let createNewVitalsSurveyResponse;

    beforeAll(async () => {
      const {
        Survey,
        ProgramDataElement,
        SurveyScreenComponent,
        SurveyResponse,
        Patient,
        Encounter,
        Facility,
        Location,
        Department,
        User,
      } = models;

      // Setup a somewhat credible vitals survey
      await Survey.create({
        ...fake(models.Survey),
        id: TEST_VITALS_SURVEY_ID,
        surveyType: SURVEY_TYPES.VITALS,
      });

      dataElements = await Promise.all([
        ProgramDataElement.create({
          ...fake(ProgramDataElement),
          type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
          code: 'CodeWithoutMathSymbolsOne',
        }),
        ProgramDataElement.create({
          ...fake(ProgramDataElement),
          type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
          code: 'CodeWithoutMathSymbolsTwo',
        }),
        ProgramDataElement.create({
          ...fake(ProgramDataElement),
          type: PROGRAM_DATA_ELEMENT_TYPES.CALCULATED,
          code: 'CodeWithoutMathSymbolsThree',
        }),
        ProgramDataElement.create({
          ...fake(ProgramDataElement),
          id: VITALS_DATA_ELEMENT_IDS.dateRecorded,
          type: PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME,
          code: 'CodeWithoutMathSymbolsFour',
        }),
      ]);
      const [dataElementOne, dataElementTwo, dataElementThree, dataElementFour] = dataElements;

      await Promise.all([
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementOne.id,
          surveyId: TEST_VITALS_SURVEY_ID,
          calculation: '',
          config: '',
        }),
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementTwo.id,
          surveyId: TEST_VITALS_SURVEY_ID,
          calculation: '',
          config: '',
        }),
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementThree.id,
          surveyId: TEST_VITALS_SURVEY_ID,
          calculation: `${dataElementTwo.code}+1`,
          config: '',
        }),
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementFour.id,
          surveyId: TEST_VITALS_SURVEY_ID,
          calculation: '',
          config: '',
        }),
      ]);

      createNewVitalsSurveyResponse = async () => {
        const randomPatient = await Patient.create(fake(Patient));
        const facility = await Facility.create(fake(Facility));
        const location = await Location.create({
          ...fake(Location),
          facilityId: facility.id,
        });
        const department = await Department.create({
          ...fake(Department),
          facilityId: facility.id,
        });
        const examiner = await User.create(fake(User));
        const randomEncounter = await Encounter.create({
          ...fake(Encounter),
          patientId: randomPatient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: examiner.id,
        });

        // Calculated question is dependent on this value
        const randomNumber = chance.integer({ min: 0, max: 100 });
        const data = {
          patientId: randomPatient.id,
          encounterId: randomEncounter.id,
          surveyId: TEST_VITALS_SURVEY_ID,
          userId: app.user.id,
          answers: {
            [dataElementOne.id]: chance.integer({ min: 0, max: 100 }),
            [dataElementTwo.id]: randomNumber,
            [dataElementThree.id]: randomNumber + 1,
            [dataElementFour.id]: getCurrentDateTimeString(),
          },
        };
        const response = await SurveyResponse.sequelize.transaction(() =>
          SurveyResponse.createWithAnswers(data),
        );

        return response;
      };

      // Currently we don't have a way of accessing the central server config
      // from facility server tests. This feature needs to read that config.
      const mockLocalisation = { features: { enableVitalEdit: true } };
      await models.UserLocalisationCache.create({
        userId: app.user.id,
        localisation: JSON.stringify(mockLocalisation),
      });
    });

    describe('write', () => {
      it('should modify a survey response answer', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();
        const singleAnswer = answers.find(answer => answer.dataElementId === dataElements[0].id);
        const newValue = parseInt(singleAnswer.body, 10) + 1;
        const result = await app.put(`/v1/surveyResponseAnswer/vital/${singleAnswer.id}`).send({
          reasonForChange: 'test',
          newValue,
          date: getCurrentDateTimeString(),
        });
        expect(result).toHaveSucceeded();
        await singleAnswer.reload();
        expect(singleAnswer.body).toEqual(String(newValue));
      });

      it('should create a log on modification', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();
        const singleAnswer = answers.find(answer => answer.dataElementId === dataElements[0].id);
        const previousValue = singleAnswer.body;
        const newValue = parseInt(previousValue, 10) + 1;
        const reasonForChange = 'test2';
        const result = await app.put(`/v1/surveyResponseAnswer/vital/${singleAnswer.id}`).send({
          reasonForChange,
          newValue,
          date: getCurrentDateTimeString(),
        });
        expect(result).toHaveSucceeded();

        const log = await models.VitalLog.findOne({
          where: { answerId: singleAnswer.id },
          order: [['createdAt', 'DESC']],
        });
        expect(log.previousValue).toBe(previousValue);
        expect(log.newValue).toBe(String(newValue));
        expect(log.reasonForChange).toBe(reasonForChange);
      });

      it('should update calculated questions accordingly', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();

        // This answer is used in a calculated value
        const usedAnswer = answers.find(answer => answer.dataElementId === dataElements[1].id);
        const calculatedAnswer = answers.find(
          answer => answer.dataElementId === dataElements[2].id,
        );
        const previousValue = calculatedAnswer.body;
        const newValue = parseInt(usedAnswer.body, 10) + 1;
        const newCalculatedValue = (newValue + 1).toFixed(1);
        const reasonForChange = 'test3';

        const result = await app.put(`/v1/surveyResponseAnswer/vital/${usedAnswer.id}`).send({
          reasonForChange,
          newValue,
          date: getCurrentDateTimeString(),
        });
        expect(result).toHaveSucceeded();
        await calculatedAnswer.reload();
        const log = await models.VitalLog.findOne({
          where: { answerId: calculatedAnswer.id },
          order: [['createdAt', 'DESC']],
        });
        expect(calculatedAnswer.body).toBe(newCalculatedValue);
        expect(log.previousValue).toBe(previousValue);
        expect(log.newValue).toBe(newCalculatedValue);
        expect(log.reasonForChange).toBe(reasonForChange);
      });

      it('should only modify answers from survey vitals', async () => {
        const {
          Survey,
          SurveyResponse,
          SurveyScreenComponent,
          ProgramDataElement,
          Patient,
          Encounter,
        } = models;
        const survey = await Survey.create({
          ...fake(Survey),
          surveyType: SURVEY_TYPES.PROGRAMS,
        });
        const pde = await ProgramDataElement.create({
          ...fake(ProgramDataElement),
          type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
        });
        await SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: pde.id,
          surveyId: survey.id,
          calculation: '',
        });

        const randomPatient = await Patient.findOne();
        const randomEncounter = await Encounter.findOne({ where: { patientId: randomPatient.id } });
        const data = {
          patientId: randomPatient.id,
          encounterId: randomEncounter.id,
          surveyId: survey.id,
          answers: {
            [pde.id]: chance.string(),
          },
        };
        const response = await SurveyResponse.sequelize.transaction(() =>
          SurveyResponse.createWithAnswers(data),
        );
        const answers = await response.getAnswers();
        const singleAnswer = answers.find(answer => answer.dataElementId === pde.id);
        const result = await app.put(`/v1/surveyResponseAnswer/vital/${singleAnswer.id}`).send({
          reasonForChange: 'test4',
          newValue: chance.string(),
          date: getCurrentDateTimeString(),
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(404);
      });

      it('should only modify answers that are not calculated questions', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();
        const calculatedAnswer = answers.find(
          answer => answer.dataElementId === dataElements[2].id,
        );

        const result = await app.put(`/v1/surveyResponseAnswer/vital/${calculatedAnswer.id}`).send({
          reasonForChange: 'test5',
          newValue: chance.integer({ min: 0, max: 100 }),
          date: getCurrentDateTimeString(),
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(404);
      });

      it('should reject editing if new value is the same as previous value', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();
        const singleAnswer = answers.find(answer => answer.dataElementId === dataElements[0].id);
        const newValue = singleAnswer.body;
        const result = await app.put(`/v1/surveyResponseAnswer/vital/${singleAnswer.id}`).send({
          reasonForChange: 'test6',
          newValue,
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(422);
      });

      it('should return error if feature flag is off', async () => {
        const localisationCache = await models.UserLocalisationCache.findOne({
          where: {
            userId: app.user.id,
          },
        });
        await localisationCache.update({
          localisation: JSON.stringify({ features: { enableVitalEdit: false } }),
        });

        const result = await app.put(`/v1/surveyResponseAnswer/vital/nonImportantID`).send({
          reasonForChange: 'test7',
          newValue: chance.integer({ min: 0, max: 100 }),
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(422);
      });

      it('should return error if feature flag does not exist', async () => {
        await models.UserLocalisationCache.truncate({ cascade: true });

        const result = await app.put(`/v1/surveyResponseAnswer/vital/nonImportantID`).send({
          reasonForChange: 'test8',
          newValue: chance.integer({ min: 0, max: 100 }),
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(422);
      });
    });

    describe('create', () => {
      let extraDataElement;
      beforeAll(async () => {
        const { ProgramDataElement, SurveyScreenComponent } = models;
        // Create an extra question to be left unanswered
        extraDataElement = await ProgramDataElement.create({
          ...fake(ProgramDataElement),
          type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
          code: 'CodeWithoutMathSymbolsFive',
        });
        await SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: extraDataElement.id,
          surveyId: TEST_VITALS_SURVEY_ID,
          calculation: '',
          config: '',
        });

        // Currently we don't have a way of accessing the central server config
        // from facility server tests. This feature needs to read that config.
        const mockLocalisation = { features: { enableVitalEdit: true } };
        await models.UserLocalisationCache.create({
          userId: app.user.id,
          localisation: JSON.stringify(mockLocalisation),
        });
      });

      it('should create a survey response answer', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();
        const dateAnswer = answers.find(answer => answer.dataElementId === dataElements[3].id);
        const newValue = chance.integer({ min: 0, max: 100 });
        const result = await app.post('/v1/surveyResponseAnswer/vital').send({
          reasonForChange: 'another-test',
          newValue,
          date: getCurrentDateTimeString(),
          recordedDate: dateAnswer.body,
          dataElementId: extraDataElement.id,
          encounterId: response.encounterId,
        });
        expect(result).toHaveSucceeded();
        const createdAnswer = await models.SurveyResponseAnswer.findOne({
          where: { body: String(newValue) },
        });
        expect(createdAnswer).toBeTruthy();
      });

      it('should create a log', async () => {
        const response = await createNewVitalsSurveyResponse();
        const answers = await response.getAnswers();
        const dateAnswer = answers.find(answer => answer.dataElementId === dataElements[3].id);
        const newValue = chance.integer({ min: 0, max: 100 });
        const reasonForChange = 'another-test2';
        const date = getCurrentDateTimeString();
        const result = await app.post('/v1/surveyResponseAnswer/vital').send({
          reasonForChange,
          newValue,
          date,
          recordedDate: dateAnswer.body,
          dataElementId: extraDataElement.id,
          encounterId: response.encounterId,
        });
        expect(result).toHaveSucceeded();
        const log = await models.VitalLog.findOne({
          where: { date },
          order: [['createdAt', 'DESC']],
        });
        expect(log.newValue).toBe(String(newValue));
        expect(log.reasonForChange).toBe(reasonForChange);
      });

      it('should return error if feature flag is off', async () => {
        const localisationCache = await models.UserLocalisationCache.findOne({
          where: {
            userId: app.user.id,
          },
        });
        await localisationCache.update({
          localisation: JSON.stringify({ features: { enableVitalEdit: false } }),
        });

        const result = await app.post('/v1/surveyResponseAnswer/vital').send({
          reasonForChange: 'another-test3',
          newValue: chance.integer({ min: 0, max: 100 }),
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(422);
      });

      it('should return error if feature flag does not exist', async () => {
        await models.UserLocalisationCache.truncate({ cascade: true });

        const result = await app.post('/v1/surveyResponseAnswer/vital').send({
          reasonForChange: 'another-test4',
          newValue: chance.integer({ min: 0, max: 100 }),
        });
        expect(result).not.toHaveSucceeded();
        expect(result.status).toBe(422);
      });
    });
  });
});
