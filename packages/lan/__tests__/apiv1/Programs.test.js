import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

async function createDummyProgram() {
  return {};
}

async function createDummySurvey(program) {
  return {};
}

function getRandomAnswer(question) {
  switch(question.type) {
    case 'text':
      return rng.string();
    case 'options':
      return rng.choose(question.options);
    case 'number':
    default:
      return rng.number();
  }
}

async function createDummySurveyResponse(survey) {
  const answers = {};
  survey.questions.forEach(q => {
    answers[q.id] = getRandomAnswer(q);
  });
  return {
    surveyId: survey.id,
    answers,
  };
}

describe('Programs', () => { 

  let testPatient;
  let testEncounter;

  let testProgram;
  let testSurvey;

  beforeAll(async () => {
    testPatient = await createDummyPatient(models);
    testEncounter = await createDummyEncounter(models);

    testProgram = await createDummyProgram();
    testSurvey = await createDummySurvey(testProgram);
  });

  test.todo('should import programs from a data doc');

  it('should list available programs', async () => {
    const result = await app.get(`/v1/program`);
    expect(result).toHaveSucceeded();

    // TODO expect to be array
  });

  it('should list surveys within a program', async () => {
    const result = await app.get(`/v1/program/${testProgram.id}/surveys`);
    expect(result).toHaveSucceeded();
  });

  it('should fetch a survey', async () => {
    const result = await app.get(`/v1/survey/${testSurvey.id}`);
    expect(result).toHaveSucceeded();
  });

  it('should submit a survey response against an encounter', async () => {
    const result = await app.post(`/v1/surveyResponse`).send({
      ...createDummySurveyResponse(testSurvey),
      encounterId: encounter.id,
    });
  });

  it('should automatically create an encounter if none exists', async () => {
    const result = await app.post(`/v1/surveyResponse`).send({
      ...createDummySurveyResponse(testSurvey),
    });

    expect(result).toHaveSucceeded();

    const { encounterId } = result.body;
    expect(encounterId).toBeTruthy();
    const encounter = await app.get(`/v1/encounter/${encounterId}`);
    expect(encounter.type).toEqual('surveyResponse');
  });

  it('should list all responses to a survey', async () => {
    const result = await app.post(`/v1/survey/${survey.id}/responses`);
    expect(result).toHaveSucceeded();
  });

  it('should list responses to all surveys from a patient', async () => {
    const result = await app.get(`/v1/patient/${patient.id}/surveyResponses`);
  });

  it('should list survey responses from one encounter', async () => {
    const result = await app.get(`/v1/encounter/${encounter.id}/surveyResponses`);
  });

});
