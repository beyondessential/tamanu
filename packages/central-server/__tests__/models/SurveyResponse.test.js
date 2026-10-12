import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';
import { findOneOrCreate } from '@tamanu/fake-data/test-helpers';
import {
  PROGRAM_DATA_ELEMENT_TYPES,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  REGISTRATION_STATUSES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
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

  await models.SurveyScreenComponent.create({
    ...fake(models.SurveyScreenComponent),
    dataElementId: dataElement.id,
    surveyId: survey.id,
    config: JSON.stringify(config),
  });

  return { dataElement };
}

describe('SurveyResponse.createWithAnswers Patient Fields', () => {
  let ctx, models, patientId, encounterId, surveyId, dataElementId, patientFieldDefinitionId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    const patient = await models.Patient.create(fake(models.Patient));
    const encounter = await findOneOrCreate(models, models.Encounter, {
      patientId: patient.id,
    });

    const { PatientFieldDefinitionCategory, PatientFieldDefinition } = models;
    const category = await PatientFieldDefinitionCategory.create(
      fake(PatientFieldDefinitionCategory),
    );
    const definition = await PatientFieldDefinition.create({
      id: 'customFatherNameField',
      categoryId: category.id,
      name: 'father',
      fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
    });
    const survey = await createDummySurvey(models);
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        column: definition.id,
        writeToPatient: {
          fieldName: definition.id,
          isCustomPatientField: true,
        },
      },
    });

    patientId = patient.id;
    encounterId = encounter.id;
    surveyId = survey.id;
    dataElementId = dataElement.id;
    patientFieldDefinitionId = definition.id;
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

  it('writes to patient custom fields from actions', async () => {
    const { SurveyResponse, SurveyResponseAnswer, PatientFieldValue } = models;

    await SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: surveyId,
        answers: {
          [dataElementId]: 'alastair',
        },
      }),
    );

    expect(await SurveyResponse.findOne()).toMatchObject({
      surveyId: surveyId,
      encounterId,
      result: 0,
      resultText: '',
    });
    expect(await SurveyResponseAnswer.findOne()).toMatchObject({
      dataElementId: dataElementId,
      body: 'alastair',
    });

    expect(
      await PatientFieldValue.findOne({
        where: {
          definitionId: patientFieldDefinitionId,
          patientId,
        },
        order: [['updatedAt', 'DESC']],
      }),
    ).toMatchObject({
      value: 'alastair',
    });
  });

  it('edits patient custom fields from actions', async () => {
    const { SurveyResponse, PatientFieldValue } = models;

    await PatientFieldValue.findOrCreate({
      where: { patientId: patientId, definitionId: patientFieldDefinitionId },
      defaults: { value: 'john' },
    });

    await SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: surveyId,
        answers: {
          [dataElementId]: 'James Smith',
        },
      }),
    );

    expect(
      await PatientFieldValue.findOne({
        where: {
          definitionId: patientFieldDefinitionId,
          patientId,
        },
        order: [['updatedAt', 'DESC']],
      }),
    ).toMatchObject({
      value: 'James Smith',
    });
  });
});

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

    await expect(() =>
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

  it('computes result from calculated answers when the client does not precompute them', async () => {
    const survey = await createDummySurvey(models);
    const numberElement = await models.ProgramDataElement.create({
      ...fake(models.ProgramDataElement),
      code: 'testNumber',
      type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
    });
    await models.SurveyScreenComponent.create({
      ...fake(models.SurveyScreenComponent),
      dataElementId: numberElement.id,
      surveyId: survey.id,
    });
    const resultElement = await models.ProgramDataElement.create({
      ...fake(models.ProgramDataElement),
      code: 'testResult',
      type: PROGRAM_DATA_ELEMENT_TYPES.RESULT,
    });
    await models.SurveyScreenComponent.create({
      ...fake(models.SurveyScreenComponent),
      dataElementId: resultElement.id,
      surveyId: survey.id,
      calculation: 'testNumber * 2',
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        surveyId: survey.id,
        answers: {
          [numberElement.id]: 40,
        },
      }),
    );

    expect(await models.SurveyResponse.findOne()).toMatchObject({
      surveyId: survey.id,
      encounterId,
      result: 80,
      resultText: '80%',
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
      }),
    );
    const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });
    const { id: userId } = await models.User.create({
      displayName: 'Test clinician',
      email: 'testclinician@test.test',
    });

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
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

  it('sets registration date to endTime on new registration', async () => {
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        programId: survey.programId,
      }),
    );
    const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });
    const { id: userId } = await models.User.create({
      displayName: 'Test clinician',
      email: 'testclinician-date@test.test',
    });

    const submittedEndTime = '2024-01-15 10:30:00';

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        endTime: submittedEndTime,
        answers: {
          [dataElement.id]: clinicalStatus.id,
        },
      }),
    );

    const registration = await models.PatientProgramRegistration.findOne();
    expect(registration.date).toBe(submittedEndTime);
  });

  it('does not overwrite registration date on subsequent survey submission', async () => {
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        programId: survey.programId,
      }),
    );
    const clinicalStatus1 = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const clinicalStatus2 = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: registry.id,
      }),
    );
    const { dataElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: {
        writeToPatient: {
          fieldName: 'registrationClinicalStatus',
        },
      },
    });
    const { id: userId } = await models.User.create({
      displayName: 'Test clinician',
      email: 'testclinician-noupdate@test.test',
    });

    const originalEndTime = '2024-01-15 10:30:00';

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        endTime: originalEndTime,
        answers: {
          [dataElement.id]: clinicalStatus1.id,
        },
      }),
    );

    const registrationAfterCreate = await models.PatientProgramRegistration.findOne();
    expect(registrationAfterCreate.date).toBe(originalEndTime);
    expect(registrationAfterCreate.clinicalStatusId).toBe(clinicalStatus1.id);

    const laterEndTime = '2024-06-01 14:00:00';

    await models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId,
        encounterId,
        userId,
        surveyId: survey.id,
        endTime: laterEndTime,
        answers: {
          [dataElement.id]: clinicalStatus2.id,
        },
      }),
    );

    const registrationAfterUpdate = await models.PatientProgramRegistration.findOne();
    expect(registrationAfterUpdate.clinicalStatusId).toBe(clinicalStatus2.id);
    expect(registrationAfterUpdate.date).toBe(originalEndTime);
  });
});

describe('SurveyResponse.createWithAnswers related conditions', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterEach(async () => {
    await models.SurveyResponse.truncate();
    await models.SurveyResponseAnswer.truncate();
    await models.PatientProgramRegistrationCondition.truncate();
    await models.PatientProgramRegistration.truncate();
    await models.ProgramRegistryConditionCategory.truncate({ cascade: true });
    await models.ProgramRegistryCondition.truncate({ cascade: true });
    await models.ProgramRegistryClinicalStatus.truncate({ cascade: true });
    await models.ProgramRegistry.truncate({ cascade: true });
  });

  afterAll(async () => {
    await ctx.close();
  });

  async function setUp({ registrationStatus = REGISTRATION_STATUSES.ACTIVE } = {}) {
    const patient = await models.Patient.create(fake(models.Patient));
    const encounter = await findOneOrCreate(models, models.Encounter, { patientId: patient.id });
    const user = await models.User.create(fake(models.User));
    const survey = await createDummySurvey(models);
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        programId: survey.programId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const [asthma, diabetes] = await Promise.all(
      ['Asthma', 'Diabetes'].map(name =>
        models.ProgramRegistryCondition.create(
          fake(models.ProgramRegistryCondition, { programRegistryId: registry.id, name }),
        ),
      ),
    );
    const [confirmed, recordedInError] = await Promise.all(
      ['confirmed', PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR].map(code =>
        models.ProgramRegistryConditionCategory.create(
          fake(models.ProgramRegistryConditionCategory, { programRegistryId: registry.id, code }),
        ),
      ),
    );
    const registration = registrationStatus
      ? await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            patientId: patient.id,
            programRegistryId: registry.id,
            clinicianId: user.id,
            registrationStatus,
          }),
        )
      : null;
    const conditionQuestions = await Promise.all(
      [1, 2].map(() =>
        createDummyDataElement(models, survey, {
          type: PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION,
        }),
      ),
    );
    return {
      patient,
      encounter,
      user,
      survey,
      registry,
      registration,
      conditions: { asthma, diabetes },
      categories: { confirmed, recordedInError },
      conditionElementIds: conditionQuestions.map(({ dataElement }) => dataElement.id),
    };
  }

  const answer = (conditionId, categoryId) => JSON.stringify({ conditionId, categoryId });

  const submit = ({ patient, encounter, user, survey }, answers) =>
    models.SurveyResponse.sequelize.transaction(() =>
      models.SurveyResponse.createWithAnswers({
        patientId: patient.id,
        encounterId: encounter.id,
        userId: user.id,
        surveyId: survey.id,
        endTime: '2026-10-13 09:30:00',
        answers,
      }),
    );

  it('adds the condition to the active registration with submission time and user', async () => {
    const setup = await setUp();
    const { conditions, categories, conditionElementIds, registration, user } = setup;

    await submit(setup, {
      [conditionElementIds[0]]: answer(conditions.asthma.id, categories.confirmed.id),
    });

    const recorded = await models.PatientProgramRegistrationCondition.findAll();
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      patientProgramRegistrationId: registration.id,
      programRegistryConditionId: conditions.asthma.id,
      programRegistryConditionCategoryId: categories.confirmed.id,
      date: '2026-10-13 09:30:00',
      clinicianId: user.id,
    });
  });

  it('does not add a condition the patient already has, or the same one twice', async () => {
    const setup = await setUp();
    const { conditions, categories, conditionElementIds, registration } = setup;
    await models.PatientProgramRegistrationCondition.create({
      patientProgramRegistrationId: registration.id,
      programRegistryConditionId: conditions.asthma.id,
      programRegistryConditionCategoryId: categories.confirmed.id,
      date: '2026-01-01 00:00:00',
    });

    await submit(setup, {
      [conditionElementIds[0]]: answer(conditions.asthma.id, categories.confirmed.id),
      [conditionElementIds[1]]: answer(conditions.diabetes.id, categories.confirmed.id),
    });
    await submit(setup, {
      [conditionElementIds[0]]: answer(conditions.diabetes.id, categories.confirmed.id),
    });

    const recorded = await models.PatientProgramRegistrationCondition.findAll();
    expect(recorded.map(c => c.programRegistryConditionId).sort()).toEqual(
      [conditions.asthma.id, conditions.diabetes.id].sort(),
    );
  });

  it('adds a condition that was deleted or recorded in error', async () => {
    const setup = await setUp();
    const { conditions, categories, conditionElementIds, registration } = setup;
    await models.PatientProgramRegistrationCondition.bulkCreate([
      {
        patientProgramRegistrationId: registration.id,
        programRegistryConditionId: conditions.asthma.id,
        programRegistryConditionCategoryId: categories.recordedInError.id,
        date: '2026-01-01 00:00:00',
      },
      {
        patientProgramRegistrationId: registration.id,
        programRegistryConditionId: conditions.diabetes.id,
        programRegistryConditionCategoryId: categories.confirmed.id,
        date: '2026-01-01 00:00:00',
        deletionDate: '2026-02-01 00:00:00',
      },
    ]);

    await submit(setup, {
      [conditionElementIds[0]]: answer(conditions.asthma.id, categories.confirmed.id),
      [conditionElementIds[1]]: answer(conditions.diabetes.id, categories.confirmed.id),
    });

    expect(await models.PatientProgramRegistrationCondition.count()).toBe(4);
  });

  it.each([
    ['no registration', null],
    ['an inactive registration', REGISTRATION_STATUSES.INACTIVE],
    ['a registration recorded in error', REGISTRATION_STATUSES.RECORDED_IN_ERROR],
  ])('records nothing for %s', async (_, registrationStatus) => {
    const setup = await setUp({ registrationStatus });
    const { conditions, categories, conditionElementIds } = setup;

    await submit(setup, {
      [conditionElementIds[0]]: answer(conditions.asthma.id, categories.confirmed.id),
    });

    expect(await models.SurveyResponse.count()).toBe(1);
    expect(await models.PatientProgramRegistrationCondition.count()).toBe(0);
  });

  it('registers the patient and records the condition in one submission', async () => {
    const setup = await setUp({ registrationStatus: null });
    const { survey, registry, conditions, categories, conditionElementIds } = setup;
    const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, { programRegistryId: registry.id }),
    );
    const { dataElement: statusElement } = await createDummyDataElement(models, survey, {
      type: PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA,
      config: { writeToPatient: { fieldName: 'registrationClinicalStatus' } },
    });

    await submit(setup, {
      [statusElement.id]: clinicalStatus.id,
      [conditionElementIds[0]]: answer(conditions.asthma.id, categories.confirmed.id),
    });

    const registration = await models.PatientProgramRegistration.findOne();
    expect(await models.PatientProgramRegistrationCondition.findOne()).toMatchObject({
      patientProgramRegistrationId: registration.id,
      programRegistryConditionId: conditions.asthma.id,
    });
  });
});
