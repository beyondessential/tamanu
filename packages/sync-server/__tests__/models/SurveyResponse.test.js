import { fake } from '@tamanu/shared/test-helpers/fake';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

async function createDummySurvey(models) {
  const program = await models.Program.create(fake(models.Program));
  return models.Survey.create({
    ...fake(models.Program),
    programId: program.id,
  });
}

async function createDummyDataElement(models, survey, dataElementOverrides) {
  const dataElement = await models.ProgramDataElement.create({
    ...fake(models.ProgramDataElement),
    ...dataElementOverrides,
  });

  const question = await models.SurveyScreenComponent.create({
    ...fake(models.SurveyScreenComponent),
    dataElementId: dataElement.id,
    surveyId: survey.id,
  });

  return { dataElement };
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

jest.setTimeout(1000000);
describe('SurveyResponse.createWithAnswers', () => {
  let ctx;
  let models;
  let patientId;
  let encounterId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const patient = await models.Patient.create(fake(models.Patient));
    const encounter = await findOneOrCreate(models, models.Encounter, {
      patientId: patient.id,
    });
    patientId = patient.id;
    encounterId = encounter.id;
  });

  afterEach(async () => {
    await models.SurveyResponse.truncate();
    await models.SurveyResponseAnswer.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('should error if not run in a transaction', async () => {
    const survey = await createDummySurvey(models);
    const dataElement = await createDummyDataElement(models, survey, {
      type: 'text',
    });

    expect(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 'Test Answer',
        },
      }),
    ).rejects.toThrow('SurveyResponse.createWithAnswers must always run inside a transaction!');
  });

  it('creates a surveyResponse and basic answer', async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: 'text',
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 'Test Answer',
        },
      }),
    );

    expect(await models.SurveyResponse.findOne()).toMatchObject({
      surveyId: survey.id,
      encounterId,
      result: 0,
      resultText: '',
    });
    expect(await models.SurveyResponseAnswer.findOne()).toEqual({
      dataElementId: dataElement.id,
      body: 'Test Answer',
    });
  });
});
