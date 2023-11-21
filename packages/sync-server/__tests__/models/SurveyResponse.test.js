import { fake } from '@tamanu/shared/test-helpers/fake';
import { findOneOrCreate } from '@tamanu/shared/test-helpers/factory';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES, REGISTRATION_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

async function createDummySurvey(models) {
  const program = await models.Program.create(fake(models.Program));
  return models.Survey.create({
    ...fake(models.Program),
    surveyType: SURVEY_TYPES.PROGRAMS,
    programId: program.id,
  });
}

async function createDummyDataElement(models, survey, { config, ...dataElementOverrides }) {
  const dataElement = await models.ProgramDataElement.create({
    ...fake(models.ProgramDataElement),
    ...dataElementOverrides,
  });

  const question = await models.SurveyScreenComponent.create({
    ...fake(models.SurveyScreenComponent),
    dataElementId: dataElement.id,
    surveyId: survey.id,
    config: JSON.stringify(config),
  });

  return { dataElement };
}

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
    await models.ProgramRegistry.truncate();
    await models.ProgramRegistryClinicalStatus.truncate();
    await models.PatientProgramRegistration.truncate();
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

  it('creates patient data from actions', async () => {
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'email',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: 'alastair@bes.au',
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
      body: 'alastair@bes.au',
    });
    expect(await models.Patient.findByPk(patientId)).toMatchObject({
      email: 'alastair@bes.au',
    });
  });

  it('creates patient program registration from actions', async () => {
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        programId: survey.programId,
      })
    );
    const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      })
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [dataElement.id]: clinicalStatus.id,
        },
      }),
    );

    expect(await models.PatientProgramRegistration.findOne()).toMatchObject({
      patientId,
      clinicalStatusId: clinicalStatus.id,
      programRegistryId: registry.id,
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
    });
  });
});
