import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import Chance from 'chance';
import { createTestContext } from '../utilities';

const chance = new Chance();

const { baseApp, models } = createTestContext();

async function createDummyProgram() {
  return models.Program.create({
    name: 'PROGRAM-' + chance.string(),
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

async function createDummySurvey(program, dataElementCount = -1) {
  const survey = await models.Survey.create({
    programId: program.id,
    name: 'SURVEY-' + chance.string(),
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

async function submitMultipleSurveyResponses(survey, overrides, amount = 10) {
  return Promise.all(
    new Array(amount).fill(0).map(() => 
      models.SurveyResponse.create({
        ...createDummySurveyResponse(survey),
        ...overrides,
      })
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

  beforeAll(async () => {
    app = await baseApp.asRole('admin');

    testPatient = await models.Patient.create(await createDummyPatient(models));
    testEncounter = await models.Encounter.create({
      patientId: testPatient.id,
      ...(await createDummyEncounter(models)),
    });

    testProgram = await createDummyProgram();
    testSurvey = await createDummySurvey(testProgram, 6);
    testSurvey2 = await createDummySurvey(testProgram, 10);
  });

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

    expect(result.body.count).toEqual(2);
    expect(result.body.data[0]).toHaveProperty('name', testSurvey.name);
    expect(result.body.data[1]).toHaveProperty('name', testSurvey2.name);
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

    it('should list all responses to a survey', async () => {
      const responses = await submitMultipleSurveyResponses(testSurvey, {
        encounterId: testEncounter.id,
      });
      const result = await app.get(`/v1/survey/${testSurvey.id}/surveyResponses`);
      expect(result).toHaveSucceeded();

      expect(result.body.count).toEqual(responses.length);
      result.body.data.map(response => {
        expect(response.encounterId).toEqual(testEncounter.id);
        expect(response.surveyId).toEqual(testSurvey.id);
      });
    });

    it('should list survey responses from one encounter', async () => {
      const responses = await submitMultipleSurveyResponses(testSurvey, {
        encounterId: testEncounter.id,
      });
      const result = await app.get(`/v1/encounter/${testEncounter.id}/surveyResponses`);
      expect(result).toHaveSucceeded();

      expect(result.body.count).toEqual(responses.length);
      result.body.data.map(response => {
        expect(response.encounterId).toEqual(testEncounter.id);
        expect(response.surveyId).toEqual(testSurvey.id);
      });
    });
  });

  describe('Submitting surveys directly against a patient', () => {
    it('should list responses to all surveys from a patient', async () => {
      const { examinerId, departmentId, locationId } = await createDummyEncounter(models);
      const patient = await models.Patient.create(await createDummyPatient(models));
      const responses = await submitMultipleSurveyResponses(testSurvey, {
        patientId: patient.id,
        examinerId,
        departmentId,
        locationId,
      });

      // negative responses
      const otherTestPatient = await models.Patient.create(await createDummyPatient(models));
      await submitMultipleSurveyResponses(testSurvey, {
        patientId: otherTestPatient.id,
        examinerId,
        departmentId,
        locationId,
      }, 5);

      const result = await app.get(`/v1/patient/${patient.id}/surveyResponses`);
      expect(result).toHaveSucceeded();

      expect(result.body.count).toEqual(responses.length);
      result.body.data.map(response => {
        expect(response.surveyId).toEqual(testSurvey.id);

        // expect encounter details to be included
        expect(response).toHaveProperty('patientId', patient.id);
        expect(response).toHaveProperty('encounterType');
        expect(response).toHaveProperty('startDate');
      });
    });

    it('should automatically create an encounter if none exists', async () => {
      const { examinerId, departmentId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,

        examinerId,
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

    it('should require a department', async () => {
      // get some valid ids
      const { examinerId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,
        examinerId,
        locationId,
      });
      expect(result).toHaveRequestError();
    });

    it('should require a location', async () => {
      // get some valid ids
      const { examinerId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,
        examinerId,
        locationId,
      });
      expect(result).toHaveRequestError();
    });

    it('should require an examiner', async () => {
      // get some valid ids
      const { departmentId, locationId } = await createDummyEncounter(models);

      const result = await app.post(`/v1/surveyResponse`).send({
        ...createDummySurveyResponse(testSurvey),
        patientId: testPatient.id,
        departmentId,
        locationId,
      });
      expect(result).toHaveRequestError();
    });
  });
});
