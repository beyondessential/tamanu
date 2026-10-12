import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  REGISTRATION_STATUSES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Survey program registry', () => {
  let ctx;
  let models;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  const createSurvey = async () => {
    const program = await models.Program.create(fake(models.Program));
    return models.Survey.create(
      fake(models.Survey, { programId: program.id, surveyType: SURVEY_TYPES.PROGRAMS }),
    );
  };

  it('returns no registry when the program has none', async () => {
    const survey = await createSurvey();

    const result = await app.get(`/api/survey/${survey.id}/programRegistry`);

    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({ programRegistry: null });
  });

  it("returns the registry's options and the patient's recorded conditions", async () => {
    const survey = await createSurvey();
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        programId: survey.programId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        mandatoryConditionEnabled: true,
      }),
    );
    const [asthma, diabetes] = await Promise.all(
      ['Asthma', 'Diabetes'].map(name =>
        models.ProgramRegistryCondition.create(
          fake(models.ProgramRegistryCondition, {
            programRegistryId: registry.id,
            name,
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          }),
        ),
      ),
    );
    const [confirmed] = await Promise.all(
      ['confirmed', PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR].map(code =>
        models.ProgramRegistryConditionCategory.create(
          fake(models.ProgramRegistryConditionCategory, {
            programRegistryId: registry.id,
            code,
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          }),
        ),
      ),
    );
    const patient = await models.Patient.create(fake(models.Patient));
    const user = await models.User.create(fake(models.User));
    const registration = await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        patientId: patient.id,
        programRegistryId: registry.id,
        clinicianId: user.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      }),
    );
    await models.PatientProgramRegistrationCondition.create({
      patientProgramRegistrationId: registration.id,
      programRegistryConditionId: asthma.id,
      programRegistryConditionCategoryId: confirmed.id,
      date: '2026-01-01 00:00:00',
    });

    const result = await app.get(
      `/api/survey/${survey.id}/programRegistry?patientId=${patient.id}`,
    );

    expect(result).toHaveSucceeded();
    expect(result.body).toEqual({
      programRegistry: { id: registry.id, name: registry.name, mandatoryConditionEnabled: true },
      conditions: [
        { id: asthma.id, name: 'Asthma' },
        { id: diabetes.id, name: 'Diabetes' },
      ],
      conditionCategories: [{ id: confirmed.id, name: confirmed.name }],
      isPatientRegistered: true,
      recordedConditionIds: [asthma.id],
    });
  });

  it('reports a patient without an active registration as not registered', async () => {
    const survey = await createSurvey();
    await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        programId: survey.programId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const patient = await models.Patient.create(fake(models.Patient));

    const result = await app.get(
      `/api/survey/${survey.id}/programRegistry?patientId=${patient.id}`,
    );

    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({ isPatientRegistered: false, recordedConditionIds: [] });
  });
});
