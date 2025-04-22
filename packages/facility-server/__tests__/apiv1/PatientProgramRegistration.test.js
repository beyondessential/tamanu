import config from 'config';
import { afterAll, beforeAll } from '@jest/globals';
import { REGISTRATION_STATUSES, PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';

describe('PatientProgramRegistration', () => {
  const [facilityId] = selectFacilityIds(config);
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

  const createProgramRegistry = async ({ ...params } = {}) => {
    delete params.clinicalStatuses;
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
          date: TEST_DATE_EARLY,
          clinicianId: app.user.id,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry3.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          patientId: patient.id,
          date: TEST_DATE_LATE,
          clinicianId: app.user.id,
        }),
      );

      // Registry 4: Should show the most recent details
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry4.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          patientId: patient.id,
          date: TEST_DATE_EARLY,
          clinicianId: app.user.id,
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: programRegistry4.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          patientId: patient.id,
          date: TEST_DATE_LATE,
          clinicianId: app.user.id,
        }),
      );

      const result = await app.get(`/api/patient/${patient.id}/programRegistration`);

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
      const result = await app.post(`/api/patient/${patient.id}/programRegistration`).send({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
        conditions: [
          {
            conditionId: programRegistryCondition.id,
            category: PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
          },
        ],
        registeringFacilityId: facilityId,
      });

      expect(result).toHaveSucceeded();

      const createdRegistration = await models.PatientProgramRegistration.findByPk(result.body.id);

      expect(createdRegistration).toMatchObject({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
      });

      const createdRegistrationCondition =
        await models.PatientProgramRegistrationCondition.findByPk(result.body.conditions[0].id);

      expect(createdRegistrationCondition).toMatchObject({
        clinicianId: clinician.id,
        date: '2023-09-02 08:00:00',
        patientProgramRegistrationId: createdRegistration.id,
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
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const result = await app.post(`/api/patient/${patient.id}/programRegistration`).send({
        // clinicianId: Should come from existing registration
        patientId: patient.id,
        programRegistryId: programRegistry1.id,
        registrationStatus: REGISTRATION_STATUSES.INACTIVE,
        date: '2023-09-02 09:00:00',
        registeringFacilityId: facilityId,
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

  describe('Updating program registrations', () => {
    let patient;
    let registration;
    let registry;
    let condition1;
    let status1;

    beforeEach(async () => {
      const clinician = await models.User.create(fake(models.User));
      patient = await models.Patient.create(fake(models.Patient));
      const program = await models.Program.create(fake(models.Program));
      registry = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program.id }),
      );
      const programRegistryCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId: registry.id }),
      );
      status1 = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId: registry.id,
          name: 'registry1-clinicalStatus',
        }),
      );
      registration = await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          programRegistryId: registry.id,
          clinicalStatusId: status1.id,
          clinicianId: clinician.id,
          patientId: patient.id,
          date: '2023-09-02 08:00:00',
        }),
      );
      condition1 = await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: programRegistryCondition.id,
        }),
      );
    });

    afterEach(async () => {
      await models.PatientProgramRegistrationCondition.truncate({ cascade: true, force: true });
      await models.ProgramRegistryCondition.truncate({ cascade: true, force: true });
      await models.Patient.truncate({ cascade: true, force: true });
      await models.ProgramRegistry.truncate({ cascade: true, force: true });
      await models.Program.truncate({ cascade: true, force: true });
    });

    it('updates a program registration field', async () => {
      const status2 = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId: registry.id,
          name: 'registry1-clinicalStatus-2',
        }),
      );

      const result = await app.put(`/api/patient/programRegistration/${registration.id}`).send({
        clinicalStatusId: status2.id,
      });

      expect(result).toHaveSucceeded();
      expect(result.body.clinicalStatusId).toBe(status2.id);

      // Check that the updated status is reflected in the database
      const updatedRegistration = await models.PatientProgramRegistration.findByPk(registration.id);
      expect(updatedRegistration.clinicalStatusId).toBe(status2.id);
    });

    it('updates a condition', async () => {
      const status2 = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId: registry.id,
          name: 'registry1-clinicalStatus-2',
        }),
      );

      const result = await app.put(`/api/patient/programRegistration/${registration.id}`).send({
        clinicalStatusId: status2.id,
        conditions: [
          {
            id: condition1.id,
            conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      const updatedCondition = await models.PatientProgramRegistrationCondition.findByPk(
        condition1.id,
      );
      expect(updatedCondition.conditionCategory).toBe(
        PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED,
      );
    });

    // Check that a condition can be added to a registration
    it('adds a new condition', async () => {
      const condition2 = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId: registry.id }),
      );

      const result = await app.put(`/api/patient/programRegistration/${registration.id}`).send({
        conditions: [
          {
            id: condition2.id,
            conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      // Check that the new condition is reflected in the database
      const updatedConditions = await models.PatientProgramRegistrationCondition.findAll({
        where: { patientProgramRegistrationId: registration.id },
      });
      expect(updatedConditions.length).toBe(2);
    });

    it('updates multiple fields at once', async () => {
      const status2 = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId: registry.id,
          name: 'registry1-clinicalStatus-2',
        }),
      );
      const condition2 = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId: registry.id }),
      );

      const result = await app.put(`/api/patient/programRegistration/${registration.id}`).send({
        clinicalStatusId: status2.id,
        conditions: [
          {
            id: condition1.id,
            conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED,
          },
          {
            id: condition2.id,
            conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
          },
        ],
      });

      expect(result).toHaveSucceeded();

      // Check that the updated status is reflected in the database
      const updatedRegistration = await models.PatientProgramRegistration.findByPk(registration.id);
      expect(updatedRegistration.clinicalStatusId).toBe(status2.id);

      // Check that the new condition is reflected in the database
      const updatedConditions = await models.PatientProgramRegistrationCondition.findAll({
        where: { patientProgramRegistrationId: registration.id },
      });
      expect(updatedConditions.length).toBe(2);
    });
  });

  describe('reading registration information', () => {
    const populate = async () => {
      const clinician = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const registry = await createProgramRegistry();
      const facility = await models.Facility.create(fake(models.Facility));
      const village = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: 'village' }),
      );

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
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          date: '2023-09-02 08:00:00',
        },
        {
          clinicianId: clinician.id,
          patientId: patient.id,
          clinicalStatusId: status2.id,
          programRegistryId: registry.id,
          registeringFacilityId: facility.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 09:00:00',
        },
        {
          // Note this record won't show up as the status hasn't changed
          // but it should have it's date as a registrationDate
          patientId: patient.id,
          programRegistryId: registry.id,
          clinicalStatusId: status2.id,
          villageId: village.id,
          registeringFacilityId: facility.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          date: '2023-09-02 10:00:00',
        },
        {
          patientId: patient.id,
          clinicalStatusId: status1.id,
          programRegistryId: registry.id,
          registeringFacilityId: facility.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          date: '2023-09-02 11:00:00',
        },
        {
          patientId: patient.id,
          clinicalStatusId: status2.id,
          programRegistryId: registry.id,
          registeringFacilityId: facility.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 11:30:00',
        },
      ];

      for (const r of records) {
        const result = await app.post(`/api/patient/${patient.id}/programRegistration`).send(r);
        expect(result).toHaveSucceeded();
      }

      return { patient, registry, records };
    };

    it('fetches the registration history for a patient', async () => {
      const { patient, registry, records } = await populate();

      const result = await app.get(
        `/api/patient/${patient.id}/programRegistration/${registry.id}/history`,
      );
      expect(result).toHaveSucceeded();

      // Only expect the records where the status has changed
      const expectedRecords = [...records.slice(0, 2), ...records.slice(3)];
      // it'll give us latest-first, so reverse it
      const history = [...expectedRecords].reverse();
      expect(result.body.data).toMatchObject(history);

      // also check for the correctly-joined info
      expect(result.body.data[0]).toHaveProperty('clinician.displayName');
      expect(result.body.data[0]).toHaveProperty('clinicalStatus.name');

      // Check for correct registrationDates
      expect(result.body.data[0]).toHaveProperty('registrationDate');
      // In chronological order (numbers are negative because the result is reversed, and -1 so the indexes match):
      expect(result.body.data.at(-1).registrationDate).toEqual(records.at(0).date);
      expect(result.body.data.at(-2).registrationDate).toEqual(records.at(0).date);
      // (third record is filtered out)
      expect(result.body.data.at(-3).registrationDate).toEqual(records.at(2).date);
      expect(result.body.data.at(-4).registrationDate).toEqual(records.at(2).date);
    });

    it('fetches the full detail of the latest registration', async () => {
      const { patient, registry, records } = await populate();

      const result = await app.get(`/api/patient/${patient.id}/programRegistration/${registry.id}`);
      expect(result).toHaveSucceeded();

      const record = result.body;
      expect(record).toMatchObject(records.slice(-1)[0]);
      expect(record).toHaveProperty('clinician.displayName');
      expect(record).toHaveProperty('clinicalStatus.name');
      expect(record).toHaveProperty('registeringFacility.name');
      expect(record).toHaveProperty('village.name');

      // Check for derived info:
      expect(record).toHaveProperty('registrationDate', records[2].date);
      expect(record).toHaveProperty('registrationClinician.displayName');
      expect(record).toHaveProperty('dateRemoved', records.at(-1).date);
      expect(record).toHaveProperty('removedBy.displayName');
    });

    describe('errors', () => {
      it('should get a 404 for a non-existent registration', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const registry = await createProgramRegistry();

        // real patient, real registry, but not registered
        const result = await app.get(
          `/api/patient/${patient.id}/programRegistration/${registry.id}`,
        );
        expect(result).toHaveStatus(404);
      });

      it('should require a user that can read patient info', async () => {
        const { patient, registry } = await populate();

        const newApp = await baseApp.asRole('base');
        const result = await newApp.get(
          `/api/patient/${patient.id}/programRegistration/${registry.id}`,
        );
        expect(result).toBeForbidden();
      });
    });
  });

  describe('Conditions', () => {
    describe('PUT patient/programRegistration/condition/:id', () => {
      let patient;
      let programRegistry;
      let programRegistryCondition;
      let patientProgramRegistrationCondition;
      let registration;

      beforeEach(async () => {
        patient = await models.Patient.create(fake(models.Patient));
        const program1 = await models.Program.create(fake(models.Program));
        programRegistry = await models.ProgramRegistry.create(
          fake(models.ProgramRegistry, { programId: program1.id }),
        );
        programRegistryCondition = await models.ProgramRegistryCondition.create(
          fake(models.ProgramRegistryCondition, { programRegistryId: programRegistry.id }),
        );

        // Create registration first
        registration = await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: '2023-09-02 08:00:00',
          }),
        );

        patientProgramRegistrationCondition =
          await models.PatientProgramRegistrationCondition.create(
            fake(models.PatientProgramRegistrationCondition, {
              patientProgramRegistrationId: registration.id,
              programRegistryConditionId: programRegistryCondition.id,
            }),
          );
      });

      afterEach(async () => {
        await models.PatientProgramRegistrationCondition.truncate({ cascade: true, force: true });
        await models.ProgramRegistryCondition.truncate({ cascade: true, force: true });
        await models.Patient.truncate({ cascade: true, force: true });
        await models.ProgramRegistry.truncate({ cascade: true, force: true });
        await models.Program.truncate({ cascade: true, force: true });
      });

      it('Updates a condition', async () => {
        const result = await app
          .put(
            `/api/patient/programRegistration/condition/${patientProgramRegistrationCondition.id}`,
          )
          .send({
            conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
            reasonForChange: 'Test reason',
            patientProgramRegistrationId: registration.id,
          });

        expect(result).toHaveSucceeded();

        const { conditionCategory, reasonForChange } =
          await models.PatientProgramRegistrationCondition.findByPk(result.body.id);

        expect({ conditionCategory, reasonForChange }).toMatchObject({
          conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
          reasonForChange: 'Test reason',
        });
      });

      it('Errors if condition not found', async () => {
        const result = await app
          .put(
            `/api/patient/programRegistration/condition/${patientProgramRegistrationCondition.id}/50e7046b-81c3-4c16-90e9-111111111111`,
          )
          .send({
            conditionCategory: PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
            reasonForChange: 'Test reason',
          });

        expect(result).toHaveStatus(404);
      });
    });

    describe('DELETE /programRegistration/:id', () => {
      it('should mark patient program registration as deleted and update status to recordedInError', async () => {
        // Create test data
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();

        // Create a program registration
        const registration = await models.PatientProgramRegistration.create({
          patientId: patient.id,
          programRegistryId: programRegistry.id,
          date: new Date(),
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          clinicianId: (await models.User.findOne()).id,
        });

        // Create some conditions for this registration
        const condition1 = await models.PatientProgramRegistrationCondition.create({
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: (
            await models.ProgramRegistryCondition.create({
              programRegistryId: programRegistry.id,
              name: 'Test Condition 1',
              code: 'test-condition-1',
            })
          ).id,
          date: new Date(),
        });

        const condition2 = await models.PatientProgramRegistrationCondition.create({
          patientProgramRegistrationId: registration.id,
          programRegistryConditionId: (
            await models.ProgramRegistryCondition.create({
              programRegistryId: programRegistry.id,
              name: 'Test Condition 2',
              code: 'test-condition-2',
            })
          ).id,
          date: new Date(),
        });

        // Delete the registration
        const result = await app.delete(`/api/patient/programRegistration/${registration.id}`);

        expect(result).toHaveStatus(200);
        expect(result.body).toHaveProperty('message', 'Registration successfully deleted');

        // Verify the registration is soft deleted and marked as recordedInError
        const updatedRegistration = await models.PatientProgramRegistration.findByPk(
          registration.id,
          {
            paranoid: false, // Include soft deleted records
          },
        );

        expect(updatedRegistration).toBeTruthy();
        expect(updatedRegistration.registrationStatus).toBe(
          REGISTRATION_STATUSES.RECORDED_IN_ERROR,
        );
        expect(updatedRegistration.deletedAt).toBeTruthy();

        // Verify related conditions are also soft deleted
        const updatedCondition1 = await models.PatientProgramRegistrationCondition.findByPk(
          condition1.id,
          {
            paranoid: false,
          },
        );
        const updatedCondition2 = await models.PatientProgramRegistrationCondition.findByPk(
          condition2.id,
          {
            paranoid: false,
          },
        );

        expect(updatedCondition1.deletedAt).toBeTruthy();
        expect(updatedCondition2.deletedAt).toBeTruthy();
      });

      it('should return 404 if registration does not exist', async () => {
        const result = await app.delete(
          `/api/patient/programRegistration/7c032ad3-eaa0-49b2-8077-885b78c85539`,
        );
        expect(result).toHaveStatus(404);
      });
    });

    describe('GET patient/programRegistration/:programRegistrationId/condition', () => {
      it.todo('should retrieve current patient program registration conditions');
    });
  });

  describe('Permissions', () => {
    disableHardcodedPermissionsForSuite();

    describe('GET /:patientId/programRegistration', () => {
      it('should only list registrations with a permitted registry', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const forbiddenRegistry = await createProgramRegistry({ name: 'Forbidden Registry' });
        const allowedRegistry = await createProgramRegistry({ name: 'Allowed Registry' });

        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: forbiddenRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: allowedRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', allowedRegistry.id],
          ['read', 'Patient'],
          ['read', 'PatientProgramRegistration'],
          ['list', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/${patient.id}/programRegistration`,
        );
        expect(result).toHaveSucceeded();
        expect(result.body.data.length).toBe(1);
      });
    });

    describe('POST /:patientId/programRegistration', () => {
      it('should error if program registry is forbidden', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry({ name: 'Forbidden Registry' });

        const permissions = [
          ['read', 'ProgramRegistry', 'different-object-id'],
          ['read', 'Patient'],
          ['write', 'PatientProgramRegistration'],
          ['create', 'PatientProgramRegistration'],
          ['create', 'PatientProgramRegistrationCondition'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions
          .post(`/api/patient/${patient.id}/programRegistration`)
          .send({
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
            registeringFacilityId: facilityId,
          });

        expect(result).toBeForbidden();
      });

      it('should create new registration on allowed program registry', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry({ name: 'Allowed Registry' });

        const permissions = [
          ['read', 'ProgramRegistry', programRegistry.id],
          ['read', 'Patient'],
          ['write', 'PatientProgramRegistration'],
          ['create', 'PatientProgramRegistration'],
          ['create', 'PatientProgramRegistrationCondition'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions
          .post(`/api/patient/${patient.id}/programRegistration`)
          .send({
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
            registeringFacilityId: facilityId,
          });

        expect(result).toHaveSucceeded();
        expect(result.body.programRegistryId).toBe(programRegistry.id);
      });
    });

    describe('GET /:patientId/programRegistration/:programRegistryId', () => {
      it('should error if program registry is forbidden', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', 'different-object-id'],
          ['read', 'Patient'],
          ['read', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/${patient.id}/programRegistration/${programRegistry.id}`,
        );
        expect(result).toBeForbidden();
      });

      it('should get latest registration on allowed program registry', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', programRegistry.id],
          ['read', 'Patient'],
          ['read', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/${patient.id}/programRegistration/${programRegistry.id}`,
        );
        expect(result).toHaveSucceeded();
      });
    });

    describe('GET /:patientId/programRegistration/:programRegistryId/history', () => {
      it('should error if program registry is forbidden', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', 'different-object-id'],
          ['read', 'Patient'],
          ['list', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/${patient.id}/programRegistration/${programRegistry.id}/history`,
        );
        expect(result).toBeForbidden();
      });

      it('should return history with permitted program registry', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();
        await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', programRegistry.id],
          ['read', 'Patient'],
          ['list', 'PatientProgramRegistration'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/${patient.id}/programRegistration/${programRegistry.id}/history`,
        );
        expect(result).toHaveSucceeded();
      });
    });

    describe('GET /programRegistration/:programRegistrationId/condition', () => {
      it('should error if program registry is forbidden', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();
        const registration = await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );
        const programRegistryCondition = await models.ProgramRegistryCondition.create(
          fake(models.ProgramRegistryCondition, { programRegistryId: programRegistry.id }),
        );
        await models.PatientProgramRegistrationCondition.create(
          fake(models.PatientProgramRegistrationCondition, {
            patientProgramRegistrationId: registration.id,
            programRegistryConditionId: programRegistryCondition.id,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', 'different-object-id'],
          ['read', 'Patient'],
          ['list', 'PatientProgramRegistrationCondition'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/programRegistration/${registration.id}/condition`,
        );
        expect(result).toBeForbidden();
      });

      it('should get patient conditions with permitted registry', async () => {
        const patient = await models.Patient.create(fake(models.Patient));
        const programRegistry = await createProgramRegistry();
        const registration = await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );
        const programRegistryCondition = await models.ProgramRegistryCondition.create(
          fake(models.ProgramRegistryCondition, { programRegistryId: programRegistry.id }),
        );
        await models.PatientProgramRegistrationCondition.create(
          fake(models.PatientProgramRegistrationCondition, {
            patientProgramRegistrationId: registration.id,
            programRegistryConditionId: programRegistryCondition.id,
          }),
        );

        const permissions = [
          ['read', 'ProgramRegistry', programRegistry.id],
          ['read', 'Patient'],
          ['list', 'PatientProgramRegistrationCondition'],
        ];
        const appWithPermissions = await ctx.baseApp.asNewRole(permissions);
        const result = await appWithPermissions.get(
          `/api/patient/programRegistration/${registration.id}/condition`,
        );
        expect(result).toHaveSucceeded();
      });
    });
  });
});
