import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import moment from 'moment';
import Chance from 'chance';
import { createTestContext } from '../utilities';

const chance = new Chance();

const { baseApp, models } = createTestContext();

async function createDummyProgram() {
  return models.Program.create({
    name: chance.string(),
  });
}

async function createDummyQuestion(survey, index) {
  const question = await models.SurveyQuestion.create({
    text: chance.string(),
    code: chance.string(),
  });
  const component = await models.SurveyScreenComponent.create({
    questionId: question.id,
    surveyId: survey.id,
    componentIndex: index,
    screenIndex: 0,
  });
}

async function createDummySurvey(program, questionCount = -1) {
  const survey = await models.Survey.create({
    programId: program.id,
    name: chance.string(),
  });

  const amount = (questionCount >= 0) ? questionCount : chance.integer({ min: 5, max: 10 });

  await Promise.all(new Array(amount).fill(1).map((x, i) => createDummyQuestion(survey, i)));

  return survey;
}

function getRandomAnswer(question) {
  switch(question.type) {
    case 'text':
      return chance.string();
    case 'options':
      return chance.choose(question.options);
    case 'number':
    default:
      return chance.number();
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

  let app;

  let testPatient;
  let testEncounter;

  let testProgram;
  let testSurvey;
  let testSurvey2;

  beforeAll(async () => {
    app = await baseApp.asRole('admin');

    testPatient = await createDummyPatient(models);
    testEncounter = await createDummyEncounter(models);

    testProgram = await createDummyProgram();
    testSurvey = await createDummySurvey(testProgram, 6);
    testSurvey2 = await createDummySurvey(testProgram, 10);
  });

  it('should list available programs', async () => {
    const result = await app.get(`/v1/program`);
    expect(result).toHaveSucceeded();

    const { body } = result;
    expect(body.count).toEqual(body.data.length);

    expect(body.data.every((p => p.name)));
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
    // look for every component to have a defined question with text
    expect(components.every(q => q.question)).toEqual(true);
    expect(components.every(q => q.question.text)).toEqual(true);
  });
  
  xdescribe('Survey responses', () => {
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
      expect(result).toHaveSucceeded();
    });

    it('should list survey responses from one encounter', async () => {
      const result = await app.get(`/v1/encounter/${encounter.id}/surveyResponses`);
      expect(result).toHaveSucceeded();
    });
  });

});
