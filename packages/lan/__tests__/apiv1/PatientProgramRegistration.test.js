import { fake } from 'shared/test-helpers/fake';
import { REGISTRATION_STATUSES, DELETION_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';
import { sleepAsync } from '../../../shared/src/utils/sleepAsync';

describe('PatientProgramRegistration', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;

  const TEST_DATE_EARLY = '2023-09-04 08:00:00';
  const TEST_DATE_LATE = '2023-09-04 09:00:00';

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });

  afterEach(async () => {
    await models.PatientProgramRegistration.truncate({ cascade: true });
  });

  afterAll(() => ctx.close());

  const createProgramRegistry = async ({ clinicalStatuses = [], ...params } = {}) => {
    const program = await models.Program.create(fake(models.Program));
    return models.ProgramRegistry.create(
      fake(models.ProgramRegistry, { programId: program.id, ...params }),
    );
  };

  describe('Creating and retrieving registrations', () => {

    it('fetches most recent registration for each program', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));

      // endpoint returns records in alphabetical order, so the names are relevant here
      const programRegistry1 = await createProgramRegistry({ name: 'AA-registry1' });
      const programRegistry2 = await createProgramRegistry({ name: 'BB-registry2' });
      const programRegistry3 = await createProgramRegistry({ name: 'CC-registry3' });
      const programRegistry4 = await createProgramRegistry({ name: 'DD-registry4' });

      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId: programRegistry1.id,
          name: 'registry1-clinicalStatus',
        }),
      );

      // Registration 1: Should show
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry1.id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
          date: TEST_DATE_EARLY,
        }),
      );

      // Registry 2: Should show
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry2.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: TEST_DATE_EARLY,
        }),
      );

      // Registry 3: Should not show
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry3.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
          date: undefined,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry3.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          patientId: patient.id,
          date: undefined,
        }),
      );

      // Registry 4: Should show the most recent details
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry4.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          patientId: patient.id,
          date: TEST_DATE_EARLY,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry4.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          patientId: patient.id,
          date: TEST_DATE_LATE,
        }),
      );

      const result = await app.get(`/v1/patient/${patient.id}/programRegistration`);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toMatchObject([
        {
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          clinicianId: clinician.id,
          date: TEST_DATE_EARLY,
          patientId: patient.id,
          programRegistryId: programRegistry1.id,
          programRegistry: {
            name: 'AA-registry1',
          },
          clinicalStatus: {
            name: 'registry1-clinicalStatus',
          },
        },
        {
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          programRegistryId: programRegistry2.id,
        },
        {
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: TEST_DATE_LATE,
          programRegistryId: programRegistry4.id,
        },
      ]);
    });

    it('creates a new program registration', async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const program1 = await models.Program.create(fake(models.Program));
      const programRegistry1 = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program1.id }),
      );
      const programRegistryCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId: programRegistry1.id }),
      );
      const result = await app.post(`/v1/patient/${patient.id}/programRegistration`).send({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
        conditionIds: [programRegistryCondition.id],
      });

      expect(result).toHaveSucceeded();

      const createdRegistration = await models.PatientProgramRegistration.findByPk(result.body.id);

      expect(createdRegistration).toMatchObject({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
      });

      const createdRegistrationCondition = await models.PatientProgramRegistrationCondition.findByPk(
        result.body.conditions[0].id,
      );

      expect(createdRegistrationCondition).toMatchObject({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
        programRegistryConditionId: programRegistryCondition.id,
      });
    });

    it('appends a new entry to the history for a program registration', async () => {
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

      const result = await app.post(`/v1/patient/${patient.id}/programRegistration`).send({
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

  describe('reading registration information', () => {

    const populate = async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const registry = await createProgramRegistry();
      const facility = await models.Facility.create(fake(models.Facility));
      const village = await models.ReferenceData.create(fake(models.ReferenceData, { type: 'village' }));

      const status1 = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, { programRegistryId: registry.id }),
      );
      const status2 = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, { programRegistryId: registry.id }),
      );

      const records = [
        {
          clinicianId: clinician.id,
          patientId: patient.id,
          clinicalStatusId: status1.id,
          programRegistryId: registry.id,
          registeringFacilityId: facility.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 09:00:00',
        },
        {
          patientId: patient.id,
          programRegistryId: registry.id,
          villageId: village.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 10:00:00',
        },  
        {
          patientId: patient.id,
          clinicalStatusId: status2.id,
          programRegistryId: registry.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          date: '2023-09-02 11:00:00',
        },
      ];

      for (const r of records) {
        await app.post(`/v1/patient/${patient.id}/programRegistration`).send(r);
        await sleepAsync(1000);
      }

      return { patient, registry, records };
    };

    it('fetches the registration history for a patient', async () => {
      const { patient, registry, records } = await populate();

      const result = await app.get(`/v1/patient/${patient.id}/programRegistration/${registry.id}/history`);
      expect(result).toHaveSucceeded();
      // it'll give us latest-first, so reverse it
      const history = [...records].reverse();
      expect(result.body.data).toMatchObject(history);

      // also check for the correctly-joined info
      expect(result.body.data[0]).toHaveProperty('clinician.displayName');
      expect(result.body.data[0]).toHaveProperty('clinicalStatus.name');
    });

    it('fetches the full detail of the latest registration', async () => {
      const { patient, registry, records } = await populate();
      
      const result = await app.get(`/v1/patient/${patient.id}/programRegistration/${registry.id}`);
      expect(result).toHaveSucceeded();

      const record = result.body;
      expect(record).toMatchObject(records.slice(-1)[0]);
      expect(record).toHaveProperty('clinician.displayName');
      expect(record).toHaveProperty('clinicalStatus.name');
      expect(record).toHaveProperty('registeringFacility.name');
      expect(record).toHaveProperty('village.name');
    });

    describe('errors', () => {
      it('should get a 404 for a non-existent registration', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const registry = await createProgramRegistry();
      
        // real patient, real registry, but not registered
        const result = await app.get(`/v1/patient/${patient.id}/programRegistration/${registry.id}`);
        expect(result).toHaveStatus(404);  
      });

      it('should require a user that can read patient info', async () => {
        const { patient, registry } = await populate();

        const newApp = await baseApp.asRole('base');
        const result = await newApp.get(`/v1/patient/${patient.id}/programRegistration/${registry.id}`);
        expect(result).toBeForbidden();
      });
      
    });
  });

  describe('Conditions', () => {

    describe('POST patient/:patientId/programRegistration/:programRegistryId/condition', () => {
      let patient;
      let programRegistry;
      let programRegistryCondition;

      beforeEach(async () => {
        patient = await models.Patient.create(fake(models.Patient));
        const program1 = await models.Program.create(fake(models.Program));
        programRegistry = await models.ProgramRegistry.create(
          fake(models.ProgramRegistry, { programId: program1.id }),
        );
        programRegistryCondition = await models.ProgramRegistryCondition.create(
          fake(models.ProgramRegistryCondition, { programRegistryId: programRegistry.id }),
        );
      });

      afterEach(async () => {
        await models.PatientProgramRegistrationCondition.truncate({ cascade: true, force: true });
        await models.ProgramRegistryCondition.truncate({ cascade: true, force: true });
        await models.Patient.truncate({ cascade: true, force: true });
        await models.ProgramRegistry.truncate({ cascade: true, force: true });
        await models.Program.truncate({ cascade: true, force: true });
      });

      it('creates a new condition', async () => {
        const result = await app
          .post(`/v1/patient/${patient.id}/programRegistration/${programRegistry.id}/condition`)
          .send({
            programRegistryConditionId: programRegistryCondition.id,
            date: '2023-09-02 08:00:00',
            // clinicianId: clinician.id, // No clinician, just to switch it up
          });

        expect(result).toHaveSucceeded();

        const createdCondition = await models.PatientProgramRegistrationCondition.findByPk(
          result.body.id,
        );

        expect(createdCondition).toMatchObject({
          programRegistryId: programRegistry.id,
          patientId: patient.id,
          programRegistryConditionId: programRegistryCondition.id,
          date: '2023-09-02 08:00:00',
        });
      });

      it('Will not post duplicate conditions', async () => {
        await models.PatientProgramRegistrationCondition.create(
          fake(models.PatientProgramRegistrationCondition, {
            patientId: patient.id,
            programRegistryId: programRegistry.id,
            programRegistryConditionId: programRegistryCondition.id,
            deletionStatus: null,
          }),
        );
        const result = await app
          .post(`/v1/patient/${patient.id}/programRegistration/${programRegistry.id}/condition`)
          .send({
            programRegistryConditionId: programRegistryCondition.id,
            date: '2023-09-02 08:00:00',
            // clinicianId: clinician.id, // No clinician, just to switch it up
          });

        expect(result).not.toHaveSucceeded();
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
        const createdCondition = await models.PatientProgramRegistrationCondition.create(
          fake(models.PatientProgramRegistrationCondition, {
            date: '2023-09-01 08:00:00',
            patientId: patient.id,
            programRegistryId: programRegistry1.id,
            programRegistryConditionId: programRegistryCondition.id,
          }),
        );
        const result = await app
          .delete(
            `/v1/patient/${patient.id}/programRegistration/${programRegistry1.id}/condition/${createdCondition.id}`,
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
          date: '2023-09-01 08:00:00',
          deletionDate: '2023-09-02 08:00:00',
          deletionStatus: DELETION_STATUSES.DELETED,
        });
      });
    });

  });
});
