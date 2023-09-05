import { fake } from 'shared/test-helpers/fake';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { program } from '../../app/routes/apiv1/program';

const hi = {
  programRegistryId: '123123',
  patientId: '11231231',
  registeringFacilityId: '12312312',
  registeringFacility: {
    id: '12312312',
    name: 'Home facility',
  },

  registrationStatus: 'active',

  programRegistryClinicalStatusId: '123123',
  programRegistryClinicalStatus: {
    id: '123123',
    code: 'critical',
    name: 'Critical',
    visibilityStatus: 'current',
    color: 'red',
  },

  // this...
  facilityId: '1231231',
  facility: {
    id: '1231231',
    name: 'Currently At Facility',
  },
  villageId: null,
  village: null,

  // or this...
  // facilityId: null,
  // village: null,
  // villageId: '12312312',
  // village: {
  //   id: '12312312',
  //   name: 'Currently At Village',
  // }
};
jest.setTimeout(1000000);
describe('PatientProgramRegistration', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });

  beforeEach(async () => {
    await models.PatientProgramRegistration.truncate({ cascade: true });
    // await models.Setting.truncate();
  });

  afterAll(() => ctx.close());

  describe('GET patient/:id/programRegistration', () => {
    it('fetches most recent registration for each program', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const program2 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id }),
      );
      const programRegistry2 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program2.id }),
      );
      const program1registration1 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry1.id,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: '2023-09-02 08:00:00',
        }),
      );
      const program1registration2 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry1.id,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      const program2registration1 = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          clinicianId: clinician.id,
          programRegistryId: programRegistry2.id,
          patientId: patient.id,
        }),
      );

      const result = await app.get(`/v1/patient/${patient.id}/programRegistration`);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toMatchObject([
        {
          clinicianId: clinician.id,
          date: '2023-09-04 08:00:00',
          patientId: patient.id,
          programRegistryId: programRegistry1.id,
        },
        {
          clinicianId: clinician.id,
          patientId: patient.id,
          programRegistryId: programRegistry2.id,
        },
      ]);
    });
  });

  describe('POST patient/:patientId/programRegistration/:programId', () => {
    it('creates a new program registration', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id }),
      );
      const result = await app
        .post(`/v1/patient/${patient.id}/programRegistration/${program1.id}`)
        .send({
          programRegistryId: programRegistry1.id,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: '2023-09-02 08:00:00',
        });

      expect(result).toHaveSucceeded();

      const createdRegistration = await models.PatientProgramRegistration.findByPk(result.body.id);

      expect(createdRegistration).toMatchObject({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
      });
    });

    it('edits a program registration', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id }),
      );
      const existingRegistration = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry1.id,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: '2023-09-02 08:00:00',
        }),
      );

      // Add a small delay so the registrations are definitely created at distinctly different times.
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await app
        .post(`/v1/patient/${patient.id}/programRegistration/${program1.id}`)
        .send({
          // clinicianId: Should come from existing registration
          patientId: patient.id,
          programRegistryId: programRegistry1.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 09:00:00',
        });

      expect(result).toHaveSucceeded();

      const createdRegistration = await models.PatientProgramRegistration.findByPk(result.body.id);

      expect(createdRegistration).toMatchObject({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        registrationStatus: REGISTRATION_STATUSES.INACTIVE,
        date: '2023-09-02 09:00:00',
      });
      expect(createdRegistration.updatedAt).not.toEqual(existingRegistration.updatedAt);
    });
  });
});
