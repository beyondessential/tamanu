import { fake } from '@tamanu/shared/test-helpers/fake';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

async function createDummySurvey(models) {
  const program = await models.Program.create(fake(models.Program));
  return models.Survey.create({
    ...fake(models.Program),
    surveyType: SURVEY_TYPES.PROGRAMS,
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
      type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
    });

    expect(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 12,
        },
      }),
    ).rejects.toThrow('SurveyResponse.createWithAnswers must always run inside a transaction!');
  });

  it('creates a surveyResponse and basic answer', async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 12,
        },
      }),
    );

    expect(await models.SurveyResponse.findOne()).toMatchObject({
      surveyId: survey.id,
      encounterId,
      result: 0,
      resultText: '',
    });
    expect(await models.SurveyResponseAnswer.findOne()).toMatchObject({
      dataElementId: dataElement.id,
      body: '12',
    });
  });
});
