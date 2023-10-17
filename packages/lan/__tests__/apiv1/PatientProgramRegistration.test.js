import { fake } from 'shared/test-helpers/fake';
import { REGISTRATION_STATUSES, DELETION_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

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
  });

  afterAll(() => ctx.close());

  describe('GET patient/:id/programRegistration', () => {
    it('fetches most recent registration for each program', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id, name: 'a' }),
      );
      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId: programRegistry1.id,
          name: 'aa',
        }),
      );
      const program2 = await models.Program.create(fake(models.Program));
      const programRegistry2 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program2.id, name: 'b' }),
      );
      const program3 = await models.Program.create(fake(models.Program));
      const programRegistry3 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program3.id, name: 'a' }),
      );
      const program4 = await models.Program.create(fake(models.Program));
      const programRegistry4 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program4.id, name: 'a' }),
      );

      // Registration 1: Should show
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry1.id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
          date: '2023-09-04 08:00:00',
        }),
      );

      // Registry 2: Should show
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry2.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: '2023-09-04 08:00:00',
        }),
      );

      // Registry 3: Should not show
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry3.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry3.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          patientId: patient.id,
        }),
      );

      // Registry 4: Should show the most recent details
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry4.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          patientId: patient.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry4.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          patientId: patient.id,
          date: '2023-09-04 09:00:00',
        }),
      );

      const result = await app.get(`/v1/patient/${patient.id}/programRegistration`);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toMatchObject([
        {
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          clinicianId: clinician.id,
          date: '2023-09-04 08:00:00',
          patientId: patient.id,
          programRegistryId: programRegistry1.id,
          programRegistry: {
            name: 'a',
          },
          clinicalStatus: {
            name: 'aa',
          },
        },
        {
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          programRegistryId: programRegistry2.id,
        },
        {
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-04 09:00:00',
          programRegistryId: programRegistry4.id,
        },
      ]);
    });
  });

  describe('POST patient/:patientId/programRegistration/:programRegistryId', () => {
    it('creates a new program registration', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id }),
      );
      const result = await app
        .post(`/v1/patient/${patient.id}/programRegistration/${programRegistry1.id}`)
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
        .post(`/v1/patient/${patient.id}/programRegistration/${programRegistry1.id}`)
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

  describe('DELETE patient/:patientId/programRegistration/:programRegistryId/condition', () => {
    it('Deletes a condition', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id }),
      );
      const programRegistryCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId: programRegistry1.id }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient.id,
          programRegistryId: programRegistry1.id,
          programRegistryConditionId: programRegistryCondition.id,
        }),
      );
      const result = await app
        .delete(
          `/v1/patient/${patient.id}/programRegistration/${programRegistry1.id}/condition/${programRegistryCondition.id}`,
        )
        .send({
          programRegistryConditionId: programRegistryCondition.id,
          deletionClinicianId: clinician.id,
          deletionDate: '2023-09-02 08:00:00',
        });

      expect(result).toHaveSucceeded();

      const deletedCondition = await models.PatientProgramRegistrationCondition.findByPk(
        result.body.id,
      );

      expect(deletedCondition).toMatchObject({
        programRegistryId: programRegistry1.id,
        patientId: patient.id,
        programRegistryConditionId: programRegistryCondition.id,
        date: '2023-09-02 08:00:00',
        deletionStatus: DELETION_STATUSES.DELETED,
      });
    });
  });
});
