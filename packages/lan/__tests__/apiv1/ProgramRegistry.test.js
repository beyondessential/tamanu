import { VISIBILITY_STATUSES, REGISTRATION_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { createTestContext } from '../utilities';

let baseApp = null;
let models = null;

jest.setTimeout(1000000);
describe('ProgramRegistry', () => {
  let app;
  let testProgram;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('admin');

    testProgram = await models.Program.create(fake(models.Program));
  });
  afterAll(() => ctx.close());
  afterEach(async () => {
    await models.ProgramRegistry.truncate();
  });

  describe('Getting (GET /v1/programRegistry/:id)', () => {
    it('should fetch a survey', async () => {
      const { id } = await models.ProgramRegistry.create({
        ...fake(models.ProgramRegistry),
        name: 'Hepatitis Registry',
        programId: testProgram.id,
      });

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
      await models.ProgramRegistry.create({
        ...fake(models.ProgramRegistry),
        programId: testProgram.id,
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });
      await models.ProgramRegistry.create({
        ...fake(models.ProgramRegistry),
        programId: testProgram.id,
      });

      const result = await app.get('/v1/programRegistry');
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
      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId,
          name: 'aa',
          color: 'blue',
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

      // // Patient 3: Should be filtered out (registrationStatus = removed)
      // await models.PatientProgramRegistration.create(
      //   fake(models.PatientProgramRegistration, {
      //     ...baseRegistrationData,
      //     patientId: (await models.Patient.create(fake(models.Patient, { displayId: '3' }))).id,
      //     registrationStatus: REGISTRATION_STATUSES.REMOVED,
      //   }),
      // );

      // // Patient 3: Should be filtered out (registrationStatus = removed)
      // await models.PatientProgramRegistration.create(
      //   fake(models.PatientProgramRegistration, {
      //     ...baseRegistrationData,
      //     patientId: (await models.Patient.create(fake(models.Patient, { displayId: '3' }))).id,
      //     registrationStatus: REGISTRATION_STATUSES.REMOVED,
      //   }),
      // );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/registrations`).query({
        sortBy: 'clinicalStatus',
      });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.data.length).toEqual(2);
      expect(body.data).toEqual([
        {
          clinical_status: {
            color: 'blue',
            name: 'aa',
          },
          conditions: null,
          facility: {
            name: null,
          },
          hi: 'wrong',
          patient: {
            date_of_birth: '2088-02-06',
            date_of_death: null,
            display_id: '1',
            first_name: 'Clifford',
            id: '24c7ed5c-c1be-0000-844e-85cab9e7f252',
            last_name: 'van Boven',
            sex: 'male',
            village: {
              name: null,
            },
          },
          registering_facility: {
            name: null,
          },
          registrationStatus: 'active',
          village: {
            name: null,
          },
        },
        {
          clinical_status: {
            color: null,
            name: null,
          },
          conditions: null,
          facility: {
            name: null,
          },
          patient: {
            date_of_birth: '2035-12-12',
            date_of_death: null,
            display_id: '2',
            first_name: 'Nell',
            id: '13d38138-627f-0000-97a2-15edd80c2d53',
            last_name: 'Goodwin',
            sex: 'female',
            village: {
              name: null,
            },
          },
          registering_facility: {
            name: null,
          },
          registrationStatus: 'active',
          village: {
            name: null,
          },
        },
      ]);
    });
  });
});
