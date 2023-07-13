import config from 'config';
import { createDummyPatient, createDummyEncounter } from 'shared/demoData';
import { findOneOrCreate, chance } from 'shared/test-helpers';
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

async function createDummySurvey(program, dataElementCount = -1) {
  const survey = await models.Survey.create({
    programId: program.id,
    name: `SURVEY-${chance.string()}`,
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

describe('Referrals', () => {
  let ctx = null;
  let app = null;
  let patient = null;
  let encounter = null;
  let testProgram = null;
  let testSurvey = null;
  const answers = {};

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    testProgram = await createDummyProgram();
    testSurvey = await createDummySurvey(testProgram, 6);

    testSurvey.dataElements.forEach(q => {
      answers[q.id] = getRandomAnswer(q);
    });
  });
  afterAll(() => ctx.close());

  it('should record a referral request', async () => {
    const { departmentId, locationId } = encounter;
    const result = await app.post('/v1/referral').send({
      answers,
      startTime: Date.now(),
      endTime: Date.now(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      departmentId,
      locationId,
    });
    expect(result).toHaveSucceeded();
  });

  it('should get all referrals for a patient', async () => {
    const { departmentId, locationId } = encounter;
    // create a second referral
    await app.post('/v1/referral').send({
      answers,
      startTime: Date.now(),
      endTime: Date.now(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      departmentId,
      locationId,
    });

    const result = await app.get(`/v1/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(2);
  });

  it('should use the default department if one is not provided', async () => {
    const { department: departmentCode } = config.survey.defaultCodes;
    const department = await findOneOrCreate(ctx.models, ctx.models.Department, { code: departmentCode });

    const { locationId } = encounter;
    const result = await app.post('/v1/referral').send({
      answers,
      startTime: Date.now(),
      endTime: Date.now(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      locationId,
    });

    expect(result).toHaveSucceeded();
    const initiatingEncounter = await ctx.models.Encounter.findOne({
      where: { id: result.body.initiatingEncounterId },
    });
    expect(initiatingEncounter).toHaveProperty('departmentId', department.id);
  });

  it('should use the default location if one is not provided', async () => {
    const { location: locationCode } = config.survey.defaultCodes;
    const location = await findOneOrCreate(ctx.models, ctx.models.Location, { code: locationCode });

    const { departmentId } = encounter;
    const result = await app.post('/v1/referral').send({
      answers,
      startTime: Date.now(),
      endTime: Date.now(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      departmentId,
    });

    expect(result).toHaveSucceeded();
    const initiatingEncounter = await ctx.models.Encounter.findOne({
      where: { id: result.body.initiatingEncounterId },
    });
    expect(initiatingEncounter).toHaveProperty('locationId', location.id);
  });
});
