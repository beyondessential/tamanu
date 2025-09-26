import config from 'config';
import { afterAll, beforeAll } from '@jest/globals';
import {
  REGISTRATION_STATUSES,
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
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
    await models.Setting.set('audit.changes.enabled', true, SETTINGS_SCOPES.GLOBAL);
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

  // Short for Patient Program Registration Condition
  const createPPRCondition = async ({
    programRegistryId,
    patientProgramRegistrationId,
    categoryCode,
    ...rest
  } = {}) => {
    const programRegistryCondition = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, { programRegistryId }),
    );
    const unknownConditionCategory = await models.ProgramRegistryConditionCategory.create(
      fake(models.ProgramRegistryConditionCategory, {
        programRegistryId,
        code: categoryCode || PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
      }),
    );
    return models.PatientProgramRegistrationCondition.create(
      fake(models.PatientProgramRegistrationCondition, {
        ...rest,
        patientProgramRegistrationId,
        programRegistryConditionId: programRegistryCondition.id,
        programRegistryConditionCategoryId: unknownConditionCategory.id,
      }),
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
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
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
      const conditionCategory = await models.ProgramRegistryConditionCategory.create(
        fake(models.ProgramRegistryConditionCategory, {
          programRegistryId: programRegistry1.id,
          code: 'confirmed',
        }),
      );
      const result = await app.post(`/api/patient/${patient.id}/programRegistration`).send({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
        conditions: [
          {
            conditionId: programRegistryCondition.id,
            conditionCategoryId: conditionCategory.id,
          },
        ],
        registeringFacilityId: facilityId,
      });

      expect(result).toHaveSucceeded();

      const createdRegistration = await models.PatientProgramRegistration.findOne({
        where: { id: result.body.id },
      });

      expect(createdRegistration).toMatchObject({
        programRegistryId: programRegistry1.id,
        clinicianId: clinician.id,
        patientId: patient.id,
        date: '2023-09-02 08:00:00',
      });

      const createdRegistrationCondition = await models.PatientProgramRegistrationCondition.findOne(
        {
          where: { id: result.body.conditions[0].id },
        },
      );

      expect(createdRegistrationCondition).toMatchObject({
        clinicianId: clinician.id,
        date: '2023-09-02 08:00:00',
        patientProgramRegistrationId: createdRegistration.id,
        programRegistryConditionId: programRegistryCondition.id,
      });
    });
  });

  describe('Updating program registrations', () => {
    let patient;
    let registration;
    let registry;
    let condition1;
    let status1;
    let conditionCategory;

    beforeEach(async () => {
      const clinician = await models.User.create(fake(models.User));
      patient = await models.Patient.create(fake(models.Patient));
      const program = await models.Program.create(fake(models.Program));
      registry = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: program.id }),
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
      condition1 = await createPPRCondition({
        programRegistryId: registry.id,
        patientProgramRegistrationId: registration.id,
      });
      conditionCategory = await models.ProgramRegistryConditionCategory.create(
        fake(models.ProgramRegistryConditionCategory, {
          programRegistryId: registry.id,
          code: 'suspected',
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
      const updatedRegistration = await models.PatientProgramRegistration.findOne({
        where: { id: registration.id },
      });
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
            conditionCategoryId: conditionCategory.id,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      const updatedCondition = await models.PatientProgramRegistrationCondition.findByPk(
        condition1.id,
      );
      expect(updatedCondition.programRegistryConditionCategoryId).toBe(conditionCategory.id);
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
            conditionCategoryId: conditionCategory.id,
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
            conditionCategoryId: conditionCategory.id,
          },
          {
            id: condition2.id,
            conditionCategoryId: conditionCategory.id,
          },
        ],
      });

      expect(result).toHaveSucceeded();

      // Check that the updated status is reflected in the database
      const updatedRegistration = await models.PatientProgramRegistration.findOne({
        where: { id: registration.id },
      });
      expect(updatedRegistration.clinicalStatusId).toBe(status2.id);

      // Check that the new condition is reflected in the database
      const updatedConditions = await models.PatientProgramRegistrationCondition.findAll({
        where: { patientProgramRegistrationId: registration.id },
      });
      expect(updatedConditions.length).toBe(2);
    });
  });

  // Skip as replacing appends with upsert is being done elsewhere
  describe.skip('reading registration information', () => {
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

      const registration = await app.post(`/api/patient/${patient.id}/programRegistration`).send({
        clinicianId: clinician.id,
        patientId: patient.id,
        clinicalStatusId: status1.id,
        programRegistryId: registry.id,
        registeringFacilityId: facility.id,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-02 08:00:00',
      });
      expect(registration).toHaveSucceeded();

      const registrationId = registration.body.id;

      const updates = [
        {
          clinicalStatusId: status2.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 09:00:00',
        },
        {
          clinicalStatusId: status2.id,
          villageId: village.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          date: '2023-09-02 10:00:00',
        },
        {
          clinicalStatusId: status1.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          date: '2023-09-02 11:00:00',
        },
        {
          clinicalStatusId: status2.id,
          registrationStatus: REGISTRATION_STATUSES.INACTIVE,
          date: '2023-09-02 11:30:00',
        },
      ];

      for (const update of updates) {
        const updateResult = await app
          .put(`/api/patient/programRegistration/${registrationId}`)
          .send(update);
        expect(updateResult).toHaveSucceeded();
      }

      return { patient, registry, registration: registration.body, updates };
    };

    it('fetches the registration history for a patient', async () => {
      const { patient, registry, registration, updates } = await populate();
      const result = await app.get(
        `/api/patient/${patient.id}/programRegistration/${registry.id}/history`,
      );
      expect(result).toHaveSucceeded();

      // Verify the response format
      expect(result.body).toHaveProperty('count');
      expect(result.body).toHaveProperty('data');
      expect(Array.isArray(result.body.data)).toBe(true);

      // Get the history entries
      const history = result.body.data;
      expect(history.length).toBeGreaterThan(0);

      // Check that entries are ordered by date (newest first)
      for (let i = 1; i < history.length; i++) {
        const currentDate = new Date(history[i].date);
        const previousDate = new Date(history[i - 1].date);
        expect(currentDate.getTime()).toBeLessThanOrEqual(previousDate.getTime());
      }
      // Note: updates array is in chronological order, history is in reverse chronological order
      updates.reverse();

      // Check each history entry against the expected entries
      history.forEach((entry, index) => {
        const expected = index < history.length - 1 ? updates[index] : registration;
        expect(entry).toMatchObject({
          registrationStatus: expected.registrationStatus,
          registrationDate: expected.date,
          clinicalStatusId: expected.clinicalStatusId,
        });
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('clinicalStatus');
        expect(entry.clinicalStatus).toHaveProperty('id');
        expect(entry.clinicalStatus).toHaveProperty('name');
        expect(entry).toHaveProperty('clinician');
        expect(entry.clinician).toHaveProperty('id');
        expect(entry.clinician).toHaveProperty('displayName');
        expect(entry).toHaveProperty('registrationDate');
      });
    });

    it('fetches the full detail of the latest registration', async () => {
      const { patient, registry, updates } = await populate();

      const result = await app.get(`/api/patient/${patient.id}/programRegistration/${registry.id}`);
      expect(result).toHaveSucceeded();

      const record = result.body;
      const lastUpdate = updates.at(-1);

      // Verify the record matches the latest update
      expect(record).toMatchObject({
        registrationStatus: lastUpdate.registrationStatus,
        clinicalStatusId: lastUpdate.clinicalStatusId,
        date: lastUpdate.date,
        patientId: patient.id,
        programRegistryId: registry.id,
      });

      // Verify the included relationships
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
      let patientProgramRegistrationCondition;
      let registration;
      let conditionCategory;

      beforeEach(async () => {
        patient = await models.Patient.create(fake(models.Patient));
        const program1 = await models.Program.create(fake(models.Program));
        programRegistry = await models.ProgramRegistry.create(
          fake(models.ProgramRegistry, { programId: program1.id }),
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

        patientProgramRegistrationCondition = await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
        });

        conditionCategory = await models.ProgramRegistryConditionCategory.create(
          fake(models.ProgramRegistryConditionCategory, {
            programRegistryId: programRegistry.id,
            code: 'suspected',
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
            programRegistryConditionCategoryId: conditionCategory.id,
            reasonForChange: 'Test reason',
            patientProgramRegistrationId: registration.id,
          });

        expect(result).toHaveSucceeded();

        const { programRegistryConditionCategoryId, reasonForChange } =
          await models.PatientProgramRegistrationCondition.findByPk(result.body.id);

        expect({ programRegistryConditionCategoryId, reasonForChange }).toMatchObject({
          programRegistryConditionCategoryId: conditionCategory.id,
          reasonForChange: 'Test reason',
        });
      });

      it('Errors if condition not found', async () => {
        const result = await app
          .put(
            `/api/patient/programRegistration/condition/${patientProgramRegistrationCondition.id}/50e7046b-81c3-4c16-90e9-111111111111`,
          )
          .send({
            programRegistryConditionCategoryId: conditionCategory.id,
            reasonForChange: 'Test reason',
          });

        expect(result).toHaveStatus(404);
      });
    });

    describe('DELETE /programRegistration/:id', () => {
      it('should update patient program registration status to recordedInError', async () => {
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
        const condition1 = await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
          categoryCode: 'test-condition-1',
        });

        const condition2 = await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
          categoryCode: 'test-condition-2',
        });

        // Delete the registration
        const result = await app.delete(`/api/patient/programRegistration/${registration.id}`);

        expect(result).toHaveStatus(200);
        expect(result.body).toHaveProperty('message', 'Registration successfully deleted');

        // Verify the registration is soft deleted and marked as recordedInError
        const updatedRegistration = await models.PatientProgramRegistration.findOne({
          where: { id: registration.id },
          paranoid: false, // Include soft deleted records
        });

        expect(updatedRegistration).toBeTruthy();
        expect(updatedRegistration.registrationStatus).toBe(
          REGISTRATION_STATUSES.RECORDED_IN_ERROR,
        );

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
      let patient;
      let programRegistry;
      let registration;
      let condition1;
      let condition2;

      beforeEach(async () => {
        patient = await models.Patient.create(fake(models.Patient));
        const program = await models.Program.create(fake(models.Program));
        programRegistry = await models.ProgramRegistry.create(
          fake(models.ProgramRegistry, { programId: program.id }),
        );

        registration = await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            date: TEST_DATE_EARLY,
          }),
        );

        condition1 = await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
          categoryCode: 'test-condition-1',
          date: TEST_DATE_EARLY,
        });

        condition2 = await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
          categoryCode: 'test-condition-2',
          date: TEST_DATE_LATE,
        });
      });

      afterEach(async () => {
        await models.PatientProgramRegistrationCondition.truncate({ cascade: true, force: true });
        await models.ProgramRegistryCondition.truncate({ cascade: true, force: true });
        await models.Patient.truncate({ cascade: true, force: true });
        await models.ProgramRegistry.truncate({ cascade: true, force: true });
        await models.Program.truncate({ cascade: true, force: true });
      });

      it('should retrieve current patient program registration conditions', async () => {
        const result = await app.get(
          `/api/patient/programRegistration/${registration.id}/condition`,
        );
        expect(result).toHaveSucceeded();

        // Verify the response format
        expect(result.body).toHaveProperty('count');
        expect(result.body).toHaveProperty('data');
        expect(Array.isArray(result.body.data)).toBe(true);

        // Verify the conditions data
        const conditions = result.body.data;
        expect(conditions.length).toBe(2);

        // Check that conditions are ordered by date (newest first)
        expect(conditions[0].id).toBe(condition2.id);
        expect(conditions[1].id).toBe(condition1.id);

        // Verify each condition has the expected properties
        conditions.forEach(condition => {
          expect(condition).toHaveProperty('id');
          expect(condition).toHaveProperty('patientProgramRegistrationId', registration.id);
          expect(condition).toHaveProperty('programRegistryConditionId');
          expect(condition).toHaveProperty('date');
          expect(condition).toHaveProperty('history');
          expect(Array.isArray(condition.history)).toBe(true);
        });
      });

      it('should include condition history with clinician information', async () => {
        const conditionCategory = await models.ProgramRegistryConditionCategory.create(
          fake(models.ProgramRegistryConditionCategory, {
            programRegistryId: programRegistry.id,
            code: 'confirmed',
          }),
        );
        // Update condition1 using the PUT endpoint to create history
        const updateResult = await app
          .put(`/api/patient/programRegistration/condition/${condition1.id}`)
          .send({
            programRegistryConditionCategoryId: conditionCategory.id,
            reasonForChange: 'Test reason',
            patientProgramRegistrationId: registration.id,
          });
        expect(updateResult).toHaveSucceeded();

        const result = await app.get(
          `/api/patient/programRegistration/${registration.id}/condition`,
        );
        expect(result).toHaveSucceeded();

        const conditions = result.body.data;
        const conditionWithHistory = conditions.find(c => c.id === condition1.id);

        // Verify history data
        expect(conditionWithHistory.history.length).toBe(2);
        const historyEntry = conditionWithHistory.history[0];
        expect(historyEntry).toHaveProperty('id');
        expect(historyEntry).toHaveProperty('date');
        expect(historyEntry).toHaveProperty('data');
        expect(historyEntry.data).toHaveProperty(
          'programRegistryConditionCategoryId',
          conditionCategory.id,
        );
        expect(historyEntry.data).toHaveProperty('reasonForChange', 'Test reason');
        expect(historyEntry).toHaveProperty('clinician');
        expect(historyEntry.clinician).toHaveProperty('id', app.user.id);
        expect(historyEntry.clinician).toHaveProperty('displayName');
      });
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
        const clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
          fake(models.ProgramRegistryClinicalStatus, {
            programRegistryId: programRegistry.id,
            name: 'Test Status',
          }),
        );
        const clinicalStatus2 = await models.ProgramRegistryClinicalStatus.create(
          fake(models.ProgramRegistryClinicalStatus, {
            programRegistryId: programRegistry.id,
            name: 'Test Status 2',
          }),
        );

        // Create initial registration
        const registration = await models.PatientProgramRegistration.create(
          fake(models.PatientProgramRegistration, {
            programRegistryId: programRegistry.id,
            clinicianId: app.user.id,
            patientId: patient.id,
            clinicalStatusId: clinicalStatus.id,
            registrationStatus: REGISTRATION_STATUSES.ACTIVE,
            date: TEST_DATE_EARLY,
          }),
        );

        // Update registration
        await registration.update({
          clinicalStatusId: clinicalStatus2.id,
          date: TEST_DATE_LATE,
        });

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

        // Verify the response format
        expect(result.body).toHaveProperty('count');
        expect(result.body).toHaveProperty('data');
        expect(Array.isArray(result.body.data)).toBe(true);

        // Verify the history entries
        const history = result.body.data;
        expect(history.length).toBeGreaterThan(0);

        // Check the first entry (most recent)
        const latestEntry = history[0];
        expect(latestEntry).toHaveProperty('clinicalStatusId', clinicalStatus2.id);
        expect(latestEntry).toHaveProperty('registrationDate', TEST_DATE_LATE);
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
        await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
        });

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
        await createPPRCondition({
          programRegistryId: programRegistry.id,
          patientProgramRegistrationId: registration.id,
        });

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
