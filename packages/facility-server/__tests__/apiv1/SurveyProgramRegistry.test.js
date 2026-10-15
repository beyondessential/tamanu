import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PROGRAM_DATA_ELEMENT_TYPES,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  REGISTRATION_STATUSES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
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
      registrationStatus: 'active',
      recordedConditionIds: [asthma.id],
    });
  });

  it('reports the status of a patient without an active registration', async () => {
    const survey = await createSurvey();
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        programId: survey.programId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const patient = await models.Patient.create(fake(models.Patient));
    const getOptions = () =>
      app.get(`/api/survey/${survey.id}/programRegistry?patientId=${patient.id}`);

    const unregistered = await getOptions();
    expect(unregistered).toHaveSucceeded();
    expect(unregistered.body).toMatchObject({ registrationStatus: null, recordedConditionIds: [] });

    const user = await models.User.create(fake(models.User));
    await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        patientId: patient.id,
        programRegistryId: registry.id,
        clinicianId: user.id,
        registrationStatus: REGISTRATION_STATUSES.INACTIVE,
      }),
    );
    const inactive = await getOptions();
    expect(inactive).toHaveSucceeded();
    expect(inactive.body).toMatchObject({
      registrationStatus: REGISTRATION_STATUSES.INACTIVE,
      recordedConditionIds: [],
    });
  });

  it('records a condition from a submitted response and shows it by name', async () => {
    const survey = await createSurvey();
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        programId: survey.programId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      }),
    );
    const condition = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, { programRegistryId: registry.id, name: 'Asthma' }),
    );
    const otherCondition = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, { programRegistryId: registry.id, name: 'Diabetes' }),
    );
    const category = await models.ProgramRegistryConditionCategory.create(
      fake(models.ProgramRegistryConditionCategory, {
        programRegistryId: registry.id,
        code: 'confirmed',
        name: 'Confirmed',
      }),
    );
    const dataElement = await models.ProgramDataElement.create(
      fake(models.ProgramDataElement, {
        type: PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION,
      }),
    );
    await models.SurveyScreenComponent.create(
      fake(models.SurveyScreenComponent, { surveyId: survey.id, dataElementId: dataElement.id }),
    );
    const [facilityId] = selectFacilityIds(config);
    const facility = await models.Facility.findByPk(facilityId);
    const location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id }),
    );
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const patient = await models.Patient.create(fake(models.Patient));
    const user = await models.User.create(fake(models.User));
    const encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: user.id,
      }),
    );
    const registration = await models.PatientProgramRegistration.create(
      fake(models.PatientProgramRegistration, {
        patientId: patient.id,
        programRegistryId: registry.id,
        clinicianId: user.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      }),
    );

    const submitted = await app.post('/api/surveyResponse').send({
      surveyId: survey.id,
      patientId: patient.id,
      encounterId: encounter.id,
      facilityId: facility.id,
      userId: user.id,
      endTime: '2026-10-13 09:30:00',
      answers: {
        [dataElement.id]: JSON.stringify({ conditionId: condition.id, categoryId: category.id }),
      },
    });
    expect(submitted).toHaveSucceeded();

    expect(
      await models.PatientProgramRegistrationCondition.findOne({
        where: { patientProgramRegistrationId: registration.id },
      }),
    ).toMatchObject({
      programRegistryConditionId: condition.id,
      programRegistryConditionCategoryId: category.id,
      clinicianId: user.id,
    });

    const response = await app.get(`/api/surveyResponse/${submitted.body.id}`);
    expect(response).toHaveSucceeded();
    expect(response.body.answers).toEqual([
      expect.objectContaining({ dataElementId: dataElement.id, body: 'Asthma (Confirmed)' }),
    ]);

    await models.PatientProgramRegistrationCondition.update(
      { deletionDate: '2026-10-14 09:00:00' },
      { where: { patientProgramRegistrationId: registration.id } },
    );
    const edited = await app.patch(`/api/surveyResponse/${submitted.body.id}`).send({
      facilityId: facility.id,
      editedTime: getCurrentDateTimeString(),
      answers: {
        [dataElement.id]: JSON.stringify({
          conditionId: otherCondition.id,
          categoryId: category.id,
        }),
      },
    });
    expect(edited).toHaveSucceeded();
    const recorded = await models.PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: registration.id },
    });
    expect(recorded.map(c => [c.programRegistryConditionId, c.deletionDate])).toEqual([
      [condition.id, '2026-10-14 09:00:00'],
    ]);
  });

  describe('permissions', () => {
    disableHardcodedPermissionsForSuite();

    it('forbids reading registry options without patient read permission', async () => {
      const survey = await createSurvey();
      const baseApp = await ctx.baseApp.asRole('base');

      const result = await baseApp.get(`/api/survey/${survey.id}/programRegistry`);

      expect(result).toBeForbidden();
    });

    it('rejects an unauthenticated request', async () => {
      const survey = await createSurvey();

      const result = await ctx.baseApp.get(`/api/survey/${survey.id}/programRegistry`);

      expect(result).toHaveRequestError();
    });
  });
});
