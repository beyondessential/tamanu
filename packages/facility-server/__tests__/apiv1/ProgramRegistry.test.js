import { REGISTRATION_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { createTestContext } from '../utilities';

describe('ProgramRegistry', () => {
  let models;
  let app;
  let testProgram;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');

    testProgram = await models.Program.create(fake(models.Program));
  });
  afterAll(() => ctx.close());
  afterEach(async () => {
    await models.PatientProgramRegistration.truncate();
    await models.ProgramRegistry.truncate();
    await models.Patient.truncate({ cascade: true });
  });

  describe('Getting (GET /v1/programRegistry/:id)', () => {
    it('should fetch a survey', async () => {
      const { id } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          name: 'Hepatitis Registry',
          programId: testProgram.id,
        }),
      );

      const result = await app.get(`/v1/programRegistry/${id}`);
      expect(result).toHaveSucceeded();

      expect(result.body).toHaveProperty('name', 'Hepatitis Registry');
    });
  });

  describe('Listing (GET /v1/programRegistry)', () => {
    it('should list available program registries', async () => {
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          programId: testProgram.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );

      const result = await app.get('/v1/programRegistry');
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });

    it('should filter by excludePatientId', async () => {
      const testPatient = await models.Patient.create(fake(models.Patient));

      // Should show:
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );

      // Should not show (historical):
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          programId: testProgram.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      // Should not show (patient already has registration):
      const { id: registryId1 } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          patientId: testPatient.id,
          programRegistryId: registryId1,
        }),
      );

      // Should show (patient already has registration but it's deleted):
      const { id: registryId2 } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          date: '2023-09-04 08:00:00',
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          programRegistryId: registryId2,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          date: '2023-09-04 09:00:00',
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          programRegistryId: registryId2,
        }),
      );

      // Shouldn't show (patient has a registration but it's been deleted before):
      const { id: registryId3 } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          date: '2023-09-04 08:00:00',
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          programRegistryId: registryId3,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          date: '2023-09-04 09:00:00',
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          programRegistryId: registryId3,
        }),
      );

      const result = await app
        .get('/v1/programRegistry')
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
        .get('/v1/programRegistry')
        .query({ excludePatientId: "'bobby tables/\\'&;" });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(0);
    });
  });

  describe('Listing conditions (GET /v1/programRegistry/:id/conditions)', () => {
    it('should list available conditions', async () => {
      const { id: programRegistryId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/conditions`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });
  });

  describe('Listing registrations (GET /v1/programRegistry/:id/registrations)', () => {
    it('should list registrations', async () => {
      const { id: programRegistryId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
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
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-05 08:00:00',
        }),
      );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/registrations`).query({
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
        },
      ]);
    });

    it('should filter by associated condition', async () => {
      // Config models
      const { id: programRegistryId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
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

      const clinician = await models.User.create(fake(models.User, { displayName: 'Lucy' }));

      const baseRegistrationData = {
        programRegistryId,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-04 08:00:00',
      };

      // Patient 1: Should show
      const patient1 = await models.Patient.create(fake(models.Patient, { displayId: '2-1' }));
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient1.id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
        }),
      );

      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient1.id,
          programRegistryId,
          programRegistryConditionId: decoyCondition.id,
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient1.id,
          programRegistryId,
          programRegistryConditionId: relevantCondition.id,
        }),
      );

      // Patient 2: Should not show
      const patient2 = await models.Patient.create(fake(models.Patient, { displayId: '2-2' }));
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient2.id,
          programRegistryId,
          programRegistryConditionId: decoyCondition.id,
        }),
      );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/registrations`).query({
        programRegistryCondition: relevantCondition.id,
      });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(1);
      expect(body.data.length).toEqual(1);
      expect(body.data).toMatchObject([
        { conditions: expect.arrayContaining([decoyCondition.name, relevantCondition.name]) },
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
        const { id: programRegistryId } = await models.ProgramRegistry.create(
          fake(models.ProgramRegistry, { programId: testProgram.id }),
        );
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
              }),
            );
          }),
        );
      });

      it.each(patientFilters)(
        'Should only include records matching patient filter ($filter: $value)',
        async ({ filter, value }) => {
          const result = await app.get(`/v1/programRegistry/${registryId}/registrations`).query({
            rowsPerPage: 100,
            [filter]: value,
          });
          expect(result).toHaveSucceeded();

          expect(result.body.data).not.toHaveLength(0);
          result.body.data.forEach(x => {
            expect(x.patient).toHaveProperty(filter, value);
          });
        },
      );
    });
  });
});
