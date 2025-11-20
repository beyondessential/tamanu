import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  REGISTRATION_STATUSES,
  SURVEY_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
import { createDummyEncounter } from '@tamanu/database/demoData/patients';

import { createTestContext } from '../utilities';

describe('ProgramRegistry', () => {
  let models;
  let app;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  const createProgramRegistry = async ({ ...params } = {}) => {
    const program = await models.Program.create(fake(models.Program));
    return models.ProgramRegistry.create(
      fake(models.ProgramRegistry, { programId: program.id, ...params }),
    );
  };

  describe('Getting (GET /api/programRegistry/:id)', () => {
    afterEach(async () => {
      await models.PatientProgramRegistration.truncate();
      await models.ProgramRegistry.truncate();
      await models.Program.truncate();
      await models.Patient.truncate({ cascade: true });
    });

    it('should fetch a program registry', async () => {
      const { id } = await createProgramRegistry({
        name: 'Hepatitis Registry',
      });
      const result = await app.get(`/api/programRegistry/${id}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('name', 'Hepatitis Registry');
    });

    describe('Permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should error on forbidden registry', async () => {
        const forbiddenRegistry = await createProgramRegistry({
          name: 'Forbidden Registry',
        });
        const permissions = [['read', 'ProgramRegistry', 'different-object-id']];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(`/api/programRegistry/${forbiddenRegistry.id}`);
        expect(result).toBeForbidden();
      });

      it('should succeed on allowed registry', async () => {
        const allowedRegistry = await createProgramRegistry({
          name: 'Allowed Registry',
        });
        const permissions = [['read', 'ProgramRegistry', allowedRegistry.id]];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(`/api/programRegistry/${allowedRegistry.id}`);
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('name', allowedRegistry.name);
      });
    });
  });

  describe('Listing (GET /api/programRegistry)', () => {
    afterEach(async () => {
      await models.PatientProgramRegistration.truncate();
      await models.ProgramRegistry.truncate();
      await models.Program.truncate();
      await models.Patient.truncate({ cascade: true });
    });
    it('should list available program registries', async () => {
      await createProgramRegistry();
      await createProgramRegistry({
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });
      await createProgramRegistry();

      const result = await app.get('/api/programRegistry');
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });

    it('should filter by excludePatientId', async () => {
      const testPatient = await models.Patient.create(fake(models.Patient));

      // Should show:
      await createProgramRegistry();
      await createProgramRegistry();

      // Should not show (historical):
      await createProgramRegistry({
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      // Should not show (patient already has registration):
      const { id: registryId1 } = await createProgramRegistry();
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          patientId: testPatient.id,
          programRegistryId: registryId1,
          clinicianId: app.user.id,
        }),
      );

      // Should show (patient already has registration but it's deleted):
      const { id: registryId2 } = await createProgramRegistry();
      const registrationOne = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          date: '2023-09-04 08:00:00',
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          programRegistryId: registryId2,
          clinicianId: app.user.id,
        }),
      );
      await registrationOne.update({
        registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
      })

      // Shouldn't show (patient has a registration but it's been deleted before):
      const { id: registryId3 } = await createProgramRegistry();
      const registrationTwo = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          date: '2023-09-04 08:00:00',
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          programRegistryId: registryId3,
          clinicianId: app.user.id,
        }),
      );
      await registrationTwo.update({
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      });

      const result = await app
        .get('/api/programRegistry')
        .query({ excludePatientId: testPatient.id });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(3);
      expect(result.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: registryId2,
          }),
        ]),
      );
    });

    it('should escape the excludePatientId parameter', async () => {
      const result = await app
        .get('/api/programRegistry')
        .query({ excludePatientId: "'bobby tables/\\'&;" });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(0);
    });

    describe('Permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should only list permitted registries', async () => {
        await createProgramRegistry({
          name: 'Forbidden Registry 1',
        });
        await createProgramRegistry({
          name: 'Forbidden Registry 2',
        });
        const allowedRegistryOne = await createProgramRegistry({
          name: 'Allowed Registry 1',
        });
        const allowedRegistryTwo = await createProgramRegistry({
          name: 'Allowed Registry 2',
        });
        const permissions = [
          ['list', 'ProgramRegistry', allowedRegistryOne.id],
          ['list', 'ProgramRegistry', allowedRegistryTwo.id],
          ['read', 'Patient'],
          ['read', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);

        const result = await appWithPermissions.get('/api/programRegistry');
        expect(result).toHaveSucceeded();

        const { body } = result;
        expect(body.count).toEqual(2);
        expect(body.data.length).toEqual(2);
      });
    });
  });

  describe('Listing conditions (GET /api/programRegistry/:id/conditions)', () => {
    afterEach(async () => {
      await models.PatientProgramRegistration.truncate();
      await models.ProgramRegistry.truncate();
      await models.Program.truncate();
      await models.Patient.truncate({ cascade: true });
    });
    it('should list available conditions', async () => {
      const { id: programRegistryId } = await createProgramRegistry();
      await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );

      const result = await app.get(`/api/programRegistry/${programRegistryId}/conditions`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });
  });

  describe('Listing registrations (GET /api/programRegistry/:id/registrations)', () => {
    it('should list registrations', async () => {
      const { id: programRegistryId } = await createProgramRegistry();
      const CLINICAL_STATUS_DATA = {
        name: 'aa',
        color: 'blue',
      };
      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId,
          ...CLINICAL_STATUS_DATA,
        }),
      );

      const clinician = await models.User.create(fake(models.User, { displayName: 'Lucy' }));

      const baseRegistrationData = {
        programRegistryId,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-04 08:00:00',
        clinicianId: app.user.id,
      };

      // Patient 1: Should pull all required data
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: (await models.Patient.create(fake(models.Patient, { displayId: '1' }))).id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
        }),
      );

      // Patient 2: Should show most recent registration only
      const patient2 = await models.Patient.create(fake(models.Patient, { displayId: '2' }));
      const registration = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await registration.update({
        date: '2023-09-05 08:00:00',
      });

      const result = await app
        .get(`/api/programRegistry/${programRegistryId}/registrations`)
        .query({
          sortBy: 'clinicalStatus',
        });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
      expect(body.data).toMatchObject([
        {
          clinicalStatus: CLINICAL_STATUS_DATA,
          conditions: null,
          facility: {
            name: null,
          },
          patient: {
            displayId: '1',
            village: {
              name: null,
            },
          },
          registeringFacility: {
            name: null,
          },
          registrationStatus: 'active',
          village: {
            name: null,
          },
        },
        {
          patient: {
            displayId: '2',
          },
          date: '2023-09-05 08:00:00',
        },
      ]);
    });

    it('should exclude conditions with hidden condition categories', async () => {
      const { id: programRegistryId } = await createProgramRegistry();

      const relevantCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      const decoyCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, {
          programRegistryId,
        }),
      );
      const unknownConditionCategory = await models.ProgramRegistryConditionCategory.create(
        fake(models.ProgramRegistryConditionCategory, {
          programRegistryId,
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
        }),
      );
      const errorConditionCategory = await models.ProgramRegistryConditionCategory.create(
        fake(models.ProgramRegistryConditionCategory, {
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
          programRegistryId,
        }),
      );

      const baseRegistrationData = {
        programRegistryId,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-04 08:00:00',
        clinicianId: app.user.id,
      };

      // Patient 1
      const patient1 = await models.Patient.create(fake(models.Patient, { displayId: '1-123' }));
      const registration = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient1.id,
          date: '2024-03-03 08:00:00',
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: decoyCondition.id,
          programRegistryConditionCategoryId: errorConditionCategory.id,
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: relevantCondition.id,
          programRegistryConditionCategoryId: unknownConditionCategory.id,
        }),
      );

      // Patient 2
      const patient2 = await models.Patient.create(fake(models.Patient, { displayId: '2-123' }));
      const registration2 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2024-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration2.id,
          programRegistryConditionId: decoyCondition.id,
          programRegistryConditionCategoryId: errorConditionCategory.id,
        }),
      );

      const result = await app.get(`/api/programRegistry/${programRegistryId}/registrations`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
      const patient1Conditions = body.data[0].conditions;
      const patient2Conditions = body.data[1].conditions;
      expect(patient1Conditions).toEqual([
        { name: relevantCondition.name, id: relevantCondition.id },
      ]);
      expect(patient2Conditions).toEqual(null);
    });

    it('should filter by associated condition', async () => {
      // Config models
      const { id: programRegistryId } = await createProgramRegistry();
      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId,
        }),
      );
      const relevantCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      const decoyCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      const unknownConditionCategory = await models.ProgramRegistryConditionCategory.create(
        fake(models.ProgramRegistryConditionCategory, {
          programRegistryId,
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
        }),
      );
      const errorConditionCategory = await models.ProgramRegistryConditionCategory.create(
        fake(models.ProgramRegistryConditionCategory, {
          programRegistryId,
          code: PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
        }),
      );

      const clinician = await models.User.create(fake(models.User, { displayName: 'Lucy' }));

      const baseRegistrationData = {
        programRegistryId,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-04 08:00:00',
        clinicianId: app.user.id,
      };

      // Patient 1: Should show
      const patient1 = await models.Patient.create(fake(models.Patient, { displayId: '1-1' }));
      const registration = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient1.id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
        }),
      );

      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: decoyCondition.id,
          programRegistryConditionCategoryId: unknownConditionCategory.id,
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: relevantCondition.id,
          programRegistryConditionCategoryId: unknownConditionCategory.id,
        }),
      );

      // Patient 2: Should not show
      const patient2 = await models.Patient.create(fake(models.Patient, { displayId: '2-2' }));
      const registration2 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration2.id,
          programRegistryConditionId: decoyCondition.id,
          programRegistryConditionCategoryId: errorConditionCategory.id,
        }),
      );

      // Patient 3: Should not show
      const patient3 = await models.Patient.create(fake(models.Patient, { displayId: '3-3' }));
      const registration3 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient3.id,
          date: '2024-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration3.id,
          programRegistryConditionId: relevantCondition.id,
          programRegistryConditionCategoryId: errorConditionCategory.id,
        }),
      );

      const result = await app
        .get(`/api/programRegistry/${programRegistryId}/registrations`)
        .query({
          programRegistryCondition: relevantCondition.id,
        });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(1);
      expect(body.data.length).toEqual(1);
      expect(body.data).toMatchObject([
        {
          patient: {
            displayId: '1-1',
          },
          conditions: expect.arrayContaining([
            { name: decoyCondition.name, id: decoyCondition.id },
            { name: relevantCondition.name, id: relevantCondition.id },
          ]),
        },
      ]);
    });

    describe('Patient Filtering', () => {
      const patientFilters = [
        { filter: 'dateOfBirth', value: '3000-01-01' },
        { filter: 'displayId', value: 'TEST_DISPLAY_ID' },
        { filter: 'sex', value: 'male' },
        { filter: 'sex', value: 'female' },
        { filter: 'sex', value: 'other' },
        { filter: 'firstName', value: 'TEST_FIRST_NAME' },
        { filter: 'lastName', value: 'TEST_LAST_NAME' },
      ];
      let registryId = null;

      beforeAll(async () => {
        const { id: programRegistryId } = await createProgramRegistry();
        registryId = programRegistryId;
        await Promise.all(
          patientFilters.map(async ({ filter, value }) => {
            const patient = await models.Patient.create(
              fake(models.Patient, {
                [filter]: value,
              }),
            );
            await models.PatientProgramRegistration.create(
              fake(models.PatientProgramRegistration, {
                programRegistryId,
                patientId: patient.id,
                clinicianId: app.user.id,
              }),
            );
          }),
        );
      });

      it.each(patientFilters)(
        'Should only include records matching patient filter ($filter: $value)',
        async ({ filter, value }) => {
          const result = await app.get(`/api/programRegistry/${registryId}/registrations`).query({
            rowsPerPage: 100,
            [filter]: value,
          });
          expect(result).toHaveSucceeded();

          expect(result.body.data).not.toHaveLength(0);
          result.body.data.forEach((x) => {
            expect(x.patient).toHaveProperty(filter, value);
          });
        },
      );
    });

    describe('Permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should error if program registry is forbidden', async () => {
        const { id: programRegistryId } = await createProgramRegistry();
        const { id: patientId } = await models.Patient.create(fake(models.Patient));
        const { id: clinicalStatusId } = await models.ProgramRegistryClinicalStatus.create(
          fake(models.ProgramRegistryClinicalStatus, {
            programRegistryId,
            name: 'Clinical Status A',
            color: 'blue',
          }),
        );
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId,
            patientId,
            clinicalStatusId,
            registrationStatus: REGISTRATION_STATUSES.ACTIVE,
            date: '2023-09-04 08:00:00',
            clinicianId: app.user.id,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', 'different-object-id'],
          ['read', 'Patient'],
          ['list', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/programRegistry/${programRegistryId}/registrations`,
        );
        expect(result).toBeForbidden();
      });

      it('should show registrations if program registry is permitted', async () => {
        const { id: programRegistryId } = await createProgramRegistry();
        const { id: patientId } = await models.Patient.create(fake(models.Patient));
        const { id: clinicalStatusId } = await models.ProgramRegistryClinicalStatus.create(
          fake(models.ProgramRegistryClinicalStatus, {
            programRegistryId,
            name: 'Clinical Status A',
            color: 'blue',
          }),
        );
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId,
            patientId,
            clinicalStatusId,
            registrationStatus: REGISTRATION_STATUSES.ACTIVE,
            date: '2023-09-04 08:00:00',
            clinicianId: app.user.id,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', programRegistryId],
          ['read', 'Patient'],
          ['list', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/programRegistry/${programRegistryId}/registrations`,
        );
        expect(result).toHaveSucceeded();

        const { body } = result;
        expect(body.count).toEqual(1);
        expect(body.data.length).toEqual(1);
      });
    });
  });

  describe.only('Getting linked charts (GET /api/programRegistry/:id/linkedCharts)', () => {
    let programRegistryId;
    let patient;
    let historicalSimpleChart;
    let historicalComplexChart;
    let historicalChartWithoutAnswers;

    beforeAll(async () => {
      // Create program registry and patient
      const registry = await createProgramRegistry();
      programRegistryId = registry.id;
      patient = await models.Patient.create(fake(models.Patient));

      // Create historical simple chart with answers
      historicalSimpleChart = await models.Survey.create(
        fake(models.Survey, {
          programId: registry.programId,
          surveyType: SURVEY_TYPES.SIMPLE_CHART,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          name: 'Historical Simple Chart With Answers',
        }),
      );

      // Create historical complex chart with answers
      historicalComplexChart = await models.Survey.create(
        fake(models.Survey, {
          programId: registry.programId,
          surveyType: SURVEY_TYPES.COMPLEX_CHART,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          name: 'Historical Complex Chart With Answers',
        }),
      );

      // Create encounters for the patient
      const encounter1 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const encounter2 = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Create survey responses with answers
      const response1 = await models.SurveyResponse.create(
        fake(models.SurveyResponse, {
          surveyId: historicalSimpleChart.id,
          encounterId: encounter1.id,
        }),
      );
      await models.SurveyResponseAnswer.create(
        fake(models.SurveyResponseAnswer, {
          responseId: response1.id,
        }),
      );

      const response2 = await models.SurveyResponse.create(
        fake(models.SurveyResponse, {
          surveyId: historicalComplexChart.id,
          encounterId: encounter2.id,
        }),
      );

      await models.SurveyResponseAnswer.create(
        fake(models.SurveyResponseAnswer, {
          responseId: response2.id,
        }),
      );

      // Create historical chart without answers (should not be included)
      historicalChartWithoutAnswers = await models.Survey.create(
        fake(models.Survey, {
          programId: registry.programId,
          surveyType: SURVEY_TYPES.SIMPLE_CHART,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          name: 'Historical Chart Without Answers',
        }),
      );
    });

    it('should return historical simple and complex charts with answers', async () => {
      const result = await app.get(
        `/api/programRegistry/${programRegistryId}/linkedCharts?patientId=${patient.id}`,
      );
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
      const chartIds = body.data.map((c) => c.id);
      expect(chartIds).toContain(historicalSimpleChart.id);
      expect(chartIds).toContain(historicalComplexChart.id);
      expect(chartIds).not.toContain(historicalChartWithoutAnswers.id);
    });
  });
});
