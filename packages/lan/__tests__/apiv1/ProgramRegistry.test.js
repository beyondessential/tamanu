import { VISIBILITY_STATUSES, REGISTRATION_STATUSES } from '@tamanu/constants';
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
      const { id: existingRegistrationId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          patientId: testPatient.id,
          programRegistryId: existingRegistrationId,
        }),
      );

      const result = await app
        .get('/v1/programRegistry')
        .query({ excludePatientId: testPatient.id });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(2);
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
    it('should list available program registries', async () => {
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
  });
});
