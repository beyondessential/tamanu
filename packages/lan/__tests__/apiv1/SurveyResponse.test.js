import Chance from 'chance';
import { fake } from 'shared/test-helpers/fake';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants/surveys';
import { createTestContext } from '../utilities';

const chance = new Chance();

describe('SurveyResponse', () => {
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

  describe('autocomplete', () => {
    const setupAutocompleteSurvey = async (sscConfig, answerBody) => {
      const {
        Facility,
        Location,
        Department,
        Patient,
        User,
        Encounter,
        Program,
        Survey,
        SurveyResponse,
        ProgramDataElement,
        SurveyScreenComponent,
        SurveyResponseAnswer,
      } = models;

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
      const patient = await Patient.create(fake(Patient));
      const encounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
      });
      const program = await Program.create(fake(Program));
      const survey = await Survey.create({
        ...fake(Survey),
        programId: program.id,
      });
      const response = await SurveyResponse.create({
        ...fake(SurveyResponse),
        surveyId: survey.id,
        encounterId: encounter.id,
      });
      const dataElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: 'Autocomplete',
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        responseId: response.id,
        dataElementId: dataElement.id,
        surveyId: survey.id,
        config: sscConfig,
      });
      const answer = await SurveyResponseAnswer.create({
        ...fake(SurveyResponseAnswer),
        dataElementId: dataElement.id,
        responseId: response.id,
        body: answerBody,
      });

      return { answer, response };
    };

    it("should look up an autocomplete component's source model and extract a name", async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { answer, response } = await setupAutocompleteSurvey(
        JSON.stringify({
          source: 'Facility',
        }),
        facility.id,
      );

      // act
      const result = await app.get(`/v1/surveyResponse/${response.id}`);

      // assert
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        answers: [
          {
            id: answer.id,
            originalBody: facility.id,
            body: facility.name,
          },
        ],
      });
    });

    it('should error if the config has no source', async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey('{}', facility.id);

      // act
      const result = await app.get(`/v1/surveyResponse/${response.id}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: 'Survey is misconfigured: Question config did not specify a valid source',
        },
      });
    });

    it("should error if the config doesn't point to a valid source", async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Frobnizzle' }),
        facility.id,
      );

      // act
      const result = await app.get(`/v1/surveyResponse/${response.id}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: 'Survey is misconfigured: Question config did not specify a valid source',
        },
      });
    });

    it("should error if the answer body doesn't point to a real record", async () => {
      // arrange
      const { Facility } = models;
      await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        'this-facility-id-does-not-exist',
      );

      // act
      const result = await app.get(`/v1/surveyResponse/${response.id}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: `Selected answer Facility[this-facility-id-does-not-exist] not found`,
        },
      });
    });

    it('should error and hint if users might have legacy ReferenceData sources', async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'ReferenceData', where: { type: 'facility' } }),
        facility.id,
      );

      // act
      const result = await app.get(`/v1/surveyResponse/${response.id}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: `Selected answer ReferenceData[${facility.id}] not found (check that the surveyquestion's source isn't ReferenceData for a Location, Facility, or Department)`,
        },
      });
    });
  });

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
      const vitalsSurvey = await Survey.create({
        ...fake(models.Survey),
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
      ]);
      const [dataElementOne, dataElementTwo, dataElementThree] = dataElements;

      await Promise.all([
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementOne.id,
          surveyId: vitalsSurvey.id,
          calculation: '',
          config: '',
        }),
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementTwo.id,
          surveyId: vitalsSurvey.id,
          calculation: '',
          config: '',
        }),
        SurveyScreenComponent.create({
          ...fake(SurveyScreenComponent),
          dataElementId: dataElementThree.id,
          surveyId: vitalsSurvey.id,
          calculation: `${dataElementTwo.code}+1`,
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
          surveyId: vitalsSurvey.id,
          answers: {
            [dataElementOne.id]: chance.integer({ min: 0, max: 100 }),
            [dataElementTwo.id]: randomNumber,
            [dataElementThree.id]: randomNumber + 1,
          },
        };
        const response = await SurveyResponse.sequelize.transaction(() =>
          SurveyResponse.createWithAnswers(data),
        );

        return response;
      };
    });

    it('should modify a survey response answer', async () => {
      const response = await createNewVitalsSurveyResponse();
      const answers = await response.getAnswers();
      const singleAnswer = answers.find(answer => answer.dataElementId === dataElements[0].id);
      const newValue = parseInt(singleAnswer.body, 10) + 1;
      const result = await app.put(`/v1/surveyResponse/vital/${singleAnswer.id}`).send({
        reasonForChange: 'test',
        newValue,
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
      const result = await app.put(`/v1/surveyResponse/vital/${singleAnswer.id}`).send({
        reasonForChange,
        newValue,
      });
      expect(result).toHaveSucceeded();

      const log = await models.VitalLog.findOne({ where: { answerId: singleAnswer.id } });
      expect(log.previousValue).toBe(previousValue);
      expect(log.newValue).toBe(String(newValue));
      expect(log.reasonForChange).toBe(reasonForChange);
    });

    it('should update calculated questions accordingly', async () => {
      const response = await createNewVitalsSurveyResponse();
      const answers = await response.getAnswers();

      // This answer is used in a calculated value
      const usedAnswer = answers.find(answer => answer.dataElementId === dataElements[1].id);
      const calculatedAnswer = answers.find(answer => answer.dataElementId === dataElements[2].id);
      const previousValue = calculatedAnswer.body;
      const newValue = parseInt(usedAnswer.body, 10) + 1;
      const newCalculatedValue = (newValue + 1).toFixed(1);
      const reasonForChange = 'test3';

      const result = await app.put(`/v1/surveyResponse/vital/${usedAnswer.id}`).send({
        reasonForChange,
        newValue,
      });
      expect(result).toHaveSucceeded();
      await calculatedAnswer.reload();
      const log = await models.VitalLog.findOne({ where: { answerId: calculatedAnswer.id } });
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
      const result = await app.put(`/v1/surveyResponse/vital/${singleAnswer.id}`).send({
        reasonForChange: 'test4',
        newValue: chance.string(),
      });
      expect(result).not.toHaveSucceeded();
      expect(result.status).toBe(404);
    });

    it('should only modify answers that are not calculated questions', async () => {
      const response = await createNewVitalsSurveyResponse();
      const answers = await response.getAnswers();
      const calculatedAnswer = answers.find(answer => answer.dataElementId === dataElements[2].id);

      const result = await app.put(`/v1/surveyResponse/vital/${calculatedAnswer.id}`).send({
        reasonForChange: 'test5',
        newValue: chance.integer({ min: 0, max: 100 }),
      });
      expect(result).not.toHaveSucceeded();
      expect(result.status).toBe(404);
    });
  });
});
