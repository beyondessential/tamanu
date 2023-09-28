import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { chance } from 'shared/test-helpers';
import { createTestContext } from '../utilities';

let baseApp = null;
let models = null;

async function createDummyProgram() {
  return models.Program.create({
    name: `PROGRAM-${chance.string()}`,
  });
}

async function createDummyDataElement(survey, index) {
  const dataElement = await models.ProgramDataElement.create({
    name: chance.string(),
    defaultText: chance.string(),
    code: chance.string(),
    type: chance.pickone(['number', 'text']),
  });

  await models.SurveyScreenComponent.create({
    dataElementId: dataElement.id,
    surveyId: survey.id,
    componentIndex: index,
    text: chance.string(),
    screenIndex: 0,
  });

  return dataElement;
}

async function createDummySurvey(program, dataElementCount = -1, overrides = {}) {
  const survey = await models.Survey.create({
    programId: program.id,
    name: `SURVEY-${chance.string()}`,
    ...overrides,
  });

  const amount = dataElementCount >= 0 ? dataElementCount : chance.integer({ min: 5, max: 10 });

  const dataElements = await Promise.all(
    new Array(amount).fill(1).map((x, i) => createDummyDataElement(survey, i)),
  );

  survey.dataElements = dataElements;

  return survey;
}

function getRandomAnswer(dataElement) {
  switch (dataElement.type) {
    case 'text':
      return chance.string();
    case 'options':
      return chance.choose(dataElement.options);
    case 'number':
    default:
      return chance.integer({ min: -100, max: 100 });
  }
}

function createDummySurveyResponse(survey) {
  const answers = {};
  survey.dataElements.forEach(q => {
    answers[q.id] = getRandomAnswer(q);
  });
  return {
    surveyId: survey.id,
    answers,
  };
}

async function submitMultipleSurveyResponses(survey, overrides, amount = 7) {
  return models.SurveyResponse.sequelize.transaction(() =>
    Promise.all(
      new Array(amount).fill(0).map(() =>
        models.SurveyResponse.createWithAnswers({
          ...createDummySurveyResponse(survey),
          ...overrides,
        }),
      ),
    ),
  );
}

describe('Programs', () => {
  let app;

  let testPatient;
  let testEncounter;

  let testProgram;
  let testSurvey;
  let testSurvey2;
  let testSurvey3;
  let testReferralSurvey;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('admin');

    testPatient = await models.Patient.create(await createDummyPatient(models));
    testEncounter = await models.Encounter.create({
      patientId: testPatient.id,
      ...(await createDummyEncounter(models)),
    });

    testProgram = await createDummyProgram();
    testSurvey = await createDummySurvey(testProgram, 6);
    testSurvey2 = await createDummySurvey(testProgram, 10);
    testSurvey3 = await createDummySurvey(testProgram, 10);
    testReferralSurvey = await createDummySurvey(testProgram, 10, {
      surveyType: SURVEY_TYPES.REFERRAL,
    });
  });
  afterAll(() => ctx.close());

  describe('Listing', () => {
    it('should list available programs', async () => {
      const result = await app.get(`/v1/program`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(body.data.length);

      expect(body.data.every(p => p.name));
    });

    it('should list surveys within a program', async () => {
      const result = await app.get(`/v1/program/${testProgram.id}/surveys`);
      expect(result).toHaveSucceeded();

      expect(result.body.count).toEqual(4);
      expect(result.body.data[0]).toHaveProperty('name', testSurvey.name);
      expect(result.body.data[1]).toHaveProperty('name', testSurvey2.name);
      expect(result.body.data[2]).toHaveProperty('name', testSurvey3.name);
      expect(result.body.data[3]).toHaveProperty('name', testReferralSurvey.name);
    });

    it('should only suggest relevant surveys', async () => {
      const [obsolete, vitals, relevant] = await models.Survey.bulkCreate([
        { programId: testProgram.id, surveyType: SURVEY_TYPES.OBSOLETE, name: 'obsolete' },
        { programId: testProgram.id, surveyType: SURVEY_TYPES.VITALS, name: 'vitals' },
        { programId: testProgram.id, surveyType: SURVEY_TYPES.PROGRAM, name: 'relevant' },
      ]);

      const result = await app.get('/v1/suggestions/survey');
      expect(result).toHaveSucceeded();
      const resultIds = result.body.map(x => x.id);
      expect(resultIds.includes(obsolete.id)).toEqual(false);
      expect(resultIds.includes(vitals.id)).toEqual(false);
      expect(resultIds.includes(relevant.id)).toEqual(true);
    });
  });

  it('should fetch a survey', async () => {
    const result = await app.get(`/v1/survey/${testSurvey.id}`);
    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body).toHaveProperty('name', testSurvey.name);
    const { components } = body;
    expect(components.length).toEqual(6);
    // look for every component to have a defined dataElement with text
    expect(components.every(q => q.dataElement)).toEqual(true);
    expect(components.every(q => q.dataElement.defaultText)).toEqual(true);
  });

  describe('Survey responses', () => {
    it('should submit a survey response against an encounter', async () => {
      const responseData = createDummySurveyResponse(testSurvey);
      const result = await app.post(`/v1/surveyResponse`).send({
        ...responseData,
        encounterId: testEncounter.id,
        surveyId: testSurvey.id,
      });

      expect(result).toHaveSucceeded();

      const { id } = result.body;
      const record = await models.SurveyResponse.findByPk(id);
      expect(record).toBeTruthy();
      expect(record.encounterId).toEqual(testEncounter.id);

      const answers = await models.SurveyResponseAnswer.findAll({ where: { responseId: id } });
      expect(answers).toHaveLength(Object.keys(responseData.answers).length);
      answers.forEach(a => {
        // answers are always stored as strings so we have to convert the numbery ones here
        expect(responseData.answers[a.dataElementId].toString()).toEqual(a.body);
      });
    });

    it('should only list program responses from an encounter, not referrals', async () => {
      const NUMBER_PROGRAM_RESPONSES = 7;
      const NUMBER_REFERRAL_SURVEY_RESPONSES = 19;
      const encounter = await models.Encounter.create({
        patientId: testPatient.id,
        ...(await createDummyEncounter(models)),
      });
      await submitMultipleSurveyResponses(
        testSurvey3,
        {
          encounterId: encounter.id,
        },
        NUMBER_PROGRAM_RESPONSES,
      );
      await submitMultipleSurveyResponses(
        testReferralSurvey,
        {
          encounterId: encounter.id,
        },
        NUMBER_REFERRAL_SURVEY_RESPONSES,
      );

      const programResponses = await app.get(
        `/v1/encounter/${encounter.id}/programResponses?rowsPerPage=100`,
      );
      expect(programResponses).toHaveSucceeded();

      expect(programResponses.body.count).toEqual(NUMBER_PROGRAM_RESPONSES);
      programResponses.body.data.forEach(response => {
        expect(response.encounterId).toEqual(encounter.id);
        expect(response.surveyId).toEqual(testSurvey3.id);
      });
    });
  });

  describe('Submitting surveys directly against a patient', () => {
    it('should list responses to all surveys of type program from a patient', async () => {
      const { examinerId, departmentId, locationId } = await createDummyEncounter(models);
      const patient = await models.Patient.create(await createDummyPatient(models));

      // populate responses
      await submitMultipleSurveyResponses(
        testSurvey,
        {
          patientId: patient.id,
          userId: examinerId,
          departmentId,
          locationId,
        },
        15,
      );

      // negative responses
      const otherTestPatient = await models.Patient.create(await createDummyPatient(models));
      await submitMultipleSurveyResponses(
        testSurvey,
        {
          patientId: otherTestPatient.id,
          userId: examinerId,
          departmentId,
          locationId,
        },
        5,
      );

      const result = await app.get(`/v1/patient/${patient.id}/programResponses?rowsPerPage=10`);
      expect(result).toHaveSucceeded();

      // check pagination is coming through ok
      expect(result.body.count).toEqual(15);
      expect(result.body.data.length).toEqual(10);

      const checkResult = response => {
        expect(response.surveyId).toEqual(testSurvey.id);

        // expect encounter details to be included
        expect(response).toHaveProperty('programName');
        expect(response).toHaveProperty('submittedBy');
        expect(response).toHaveProperty('encounterId');
      };

      // ensure data is correct
      result.body.data.forEach(checkResult);

      // check page 2
      const result2 = await app.get(
        `/v1/patient/${patient.id}/programResponses?rowsPerPage=10&page=1`,
      );
      expect(result2).toHaveSucceeded();
      expect(result2.body.data.length).toEqual(5);
      result2.body.data.forEach(checkResult);
    });

    it('should use an already-open encounter if one exists', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const existingEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
        endDate: null,
      });
      expect(patient).toBeTruthy();
      expect(existingEncounter).toHaveProperty('patientId', patient.id);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: patient.id,
      });

      expect(result).toHaveSucceeded();

      const { encounterId } = result.body;
      expect(encounterId).toBeTruthy();

      const encounter = await models.Encounter.findByPk(encounterId);
      expect(encounter).toHaveProperty('id', existingEncounter.id);
    });

    it('should automatically create an encounter if none exists', async () => {
      const { examinerId, departmentId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,
        userId: examinerId,
        departmentId,
        locationId,
      });

      expect(result).toHaveSucceeded();

      const { encounterId } = result.body;
      expect(encounterId).toBeTruthy();

      const encounter = await models.Encounter.findByPk(encounterId);
      expect(encounter.encounterType).toEqual('surveyResponse');
      expect(encounter.patientId).toEqual(testPatient.id);

      expect(encounter.startDate).toBeDefined();
      expect(encounter.endDate).toBeDefined();
    });

    describe('Fetching survey responses for a patient', () => {
      let patientId = null;

      beforeAll(async () => {
        const { examinerId, departmentId, locationId } = await createDummyEncounter(models);
        const patient = await models.Patient.create(await createDummyPatient(models));
        patientId = patient.id;

        const commonParams = { patientId, userId: examinerId, departmentId, locationId };

        // populate responses
        await submitMultipleSurveyResponses(testReferralSurvey, commonParams);

        await submitMultipleSurveyResponses(testSurvey, commonParams, 1);
        await submitMultipleSurveyResponses(testSurvey2, commonParams, 1);
      });

      it('should NOT list survey responses of type referral when fetching programResponses', async () => {
        const programResponses = await app.get(
          `/v1/patient/${patientId}/programResponses?rowsPerPage=100`,
        );

        expect(programResponses).toHaveSucceeded();
        expect(programResponses.body.count).toEqual(2);
      });

      it('should NOT list survey responses of type referral when fetching programResponses', async () => {
        const programResponses = await app.get(
          `/v1/patient/${patientId}/programResponses?surveyId=${testSurvey2.id}`,
        );

        expect(programResponses).toHaveSucceeded();
        expect(programResponses.body.count).toEqual(1);
        expect(programResponses.body.data[0]).toHaveProperty('surveyId', testSurvey2.id);
      });
    });

    describe('Survey actions', () => {
      const createWithQuestion = async ({ type, config }) => {
        const survey = await models.Survey.create({
          programId: testProgram.id,
          surveyType: SURVEY_TYPES.PROGRAM,
        });
        const code = chance.string();
        const pde = await models.ProgramDataElement.create({
          name: code,
          type,
          code,
        });
        await models.SurveyScreenComponent.create({
          surveyId: survey.id,
          dataElementId: pde.id,
          config: JSON.stringify(config),
        });
        return { pdeId: pde.id, surveyId: survey.id };
      };

      it('should create an issue for a patient', async () => {
        const { pdeId, surveyId } = await createWithQuestion({
          type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE,
          config: {
            issueType: 'issue',
            issueNote: 'test-note',
          },
        });

        const beforeIssue = await models.PatientIssue.findOne({
          where: { patientId: testPatient.id, note: 'test-note' },
        });
        expect(beforeIssue).toBeFalsy();

        const result = await app.post(`/v1/surveyResponse`).send({
          answers: { [pdeId]: true },
          surveyId,
          encounterId: testEncounter.id,
        });
        expect(result).toHaveSucceeded();

        const afterIssue = await models.PatientIssue.findAll({
          where: { patientId: testPatient.id, note: 'test-note' },
        });
        expect(afterIssue).toBeTruthy();
      });

      it('should write data to a patient record', async () => {
        const { pdeId, surveyId } = await createWithQuestion({
          type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
          config: {
            writeToPatient: {
              fieldName: 'email',
            },
          },
        });

        const TEST_EMAIL = 'updated-email@tamanu.io';
        expect(testPatient.email).not.toEqual(TEST_EMAIL);

        const result = await app.post(`/v1/surveyResponse`).send({
          answers: { [pdeId]: TEST_EMAIL },
          surveyId,
          encounterId: testEncounter.id,
        });
        expect(result).toHaveSucceeded();

        await testPatient.reload();
        expect(testPatient.email).toEqual(TEST_EMAIL);
      });

      it('should write data to an existing patientAdditionalData record', async () => {
        const { pdeId, surveyId } = await createWithQuestion({
          type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
          config: {
            writeToPatient: {
              fieldName: 'passport',
            },
          },
        });

        const TEST_PASSPORT = '123123';
        const padRecord = await models.PatientAdditionalData.getOrCreateForPatient(testPatient.id);
        expect(padRecord.passport).not.toEqual(TEST_PASSPORT);

        const result = await app.post(`/v1/surveyResponse`).send({
          answers: { [pdeId]: TEST_PASSPORT },
          surveyId,
          encounterId: testEncounter.id,
        });
        expect(result).toHaveSucceeded();

        await padRecord.reload();
        expect(padRecord.passport).toEqual(TEST_PASSPORT);
      });

      it('should create a PAD record to write to if none exists', async () => {
        const { pdeId, surveyId } = await createWithQuestion({
          type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
          config: {
            writeToPatient: {
              fieldName: 'passport',
            },
          },
        });

        const freshPatient = await models.Patient.create(await createDummyPatient(models));

        const TEST_PASSPORT = '123123';
        const noPadRecord = await models.PatientAdditionalData.getForPatient(freshPatient.id);
        expect(noPadRecord).toBeFalsy();

        const result = await app.post(`/v1/surveyResponse`).send({
          answers: { [pdeId]: TEST_PASSPORT },
          surveyId,
          patientId: freshPatient.id,
        });
        expect(result).toHaveSucceeded();

        const padRecord = await models.PatientAdditionalData.getForPatient(freshPatient.id);
        expect(padRecord).toBeTruthy();
        expect(padRecord).toHaveProperty('passport', TEST_PASSPORT);
      });
    });

    // TODO: this is not actually true - a default department is assigned
    // reinstate this test once defaults are no longer set
    it.skip('should require a department', async () => {
      // get some valid ids
      const { examinerId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,
        userId: examinerId,
        locationId,
      });
      expect(result).toHaveRequestError();
    });

    // TODO: this is not actually true - a default location is assigned
    // reinstate this test once defaults are no longer set
    it.skip('should require a location', async () => {
      // get some valid ids
      const { examinerId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,
        userId: examinerId,
        locationId,
      });
      expect(result).toHaveRequestError();
    });
  });
});
