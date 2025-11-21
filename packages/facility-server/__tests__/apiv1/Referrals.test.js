import config from 'config';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData';
import { findOneOrCreate } from '@tamanu/shared/test-helpers';
import { chance } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

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
  const [facilityId] = selectFacilityIds(config);
  let ctx = null;
  let settings = null;
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
    settings = ctx.settings[facilityId];
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    testProgram = await createDummyProgram();
    testSurvey = await createDummySurvey(testProgram, 6);

    testSurvey.dataElements.forEach((q) => {
      answers[q.id] = getRandomAnswer(q);
    });
  });
  afterAll(() => ctx.close());

  it('should record a referral request', async () => {
    const { departmentId, locationId } = encounter;
    const result = await app.post('/api/referral').send({
      answers,
      startTime: new Date(),
      endTime: new Date(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      departmentId,
      locationId,
      facilityId,
    });
    expect(result).toHaveSucceeded();
  });

  it('should get all referrals for a patient', async () => {
    const { departmentId, locationId } = encounter;
    // create a second referral
    await app.post('/api/referral').send({
      answers,
      startTime: new Date(),
      endTime: new Date(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      departmentId,
      locationId,
      facilityId,
    });

    const result = await app.get(`/api/patient/${patient.id}/referrals`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(2);
  });

  it('should use the default department if one is not provided', async () => {
    const { department: departmentCode } = await settings.get('survey.defaultCodes');
    const department = await findOneOrCreate(models, models.Department, {
      code: departmentCode,
    });

    const { locationId } = encounter;
    const result = await app.post('/api/referral').send({
      answers,
      startTime: new Date(),
      endTime: new Date(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      locationId,
      facilityId,
    });

    expect(result).toHaveSucceeded();
    const initiatingEncounter = await models.Encounter.findOne({
      where: { id: result.body.initiatingEncounterId },
    });
    expect(initiatingEncounter).toHaveProperty('departmentId', department.id);
  });

  it('should use the default location if one is not provided', async () => {
    const { location: locationCode } = await settings.get('survey.defaultCodes');
    const location = await findOneOrCreate(models, models.Location, { code: locationCode });

    const { departmentId } = encounter;
    const result = await app.post('/api/referral').send({
      answers,
      startTime: new Date(),
      endTime: new Date(),
      patientId: patient.id,
      surveyId: testSurvey.id,
      departmentId,
      facilityId,
    });

    expect(result).toHaveSucceeded();
    const initiatingEncounter = await models.Encounter.findOne({
      where: { id: result.body.initiatingEncounterId },
    });
    expect(initiatingEncounter).toHaveProperty('locationId', location.id);
  });
});
