import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Allergies Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;
  let testVillage;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PatientUser, ReferenceData } = store.models;

    // Create a test village
    testVillage = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'village',
        name: 'Test Village',
        code: 'TEST001',
      }),
    );

    // Create a test patient
    testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
        villageId: testVillage.id,
      }),
    );

    // Create a test patient user
    await PatientUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      role: 'patient',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Login to get auth token
    const loginResponse = await baseApp.post('/api/portal/login').send({
      email: TEST_PATIENT_EMAIL,
    });

    expect(loginResponse).toHaveSucceeded();
    authToken = loginResponse.body.token;
  });

  afterAll(async () => close());

  describe('GET /api/portal/me/allergies', () => {
    beforeAll(async () => {
      const { PatientAllergy, ReferenceData } = store.models;

      // Create test allergy reference data
      const testAllergy = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'allergy',
          name: 'Penicillin',
          code: 'PEN001',
        }),
      );

      // Create test reaction reference data
      const testReaction = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'reaction',
          name: 'Rash',
          code: 'RASH001',
        }),
      );

      // Create a test patient allergy
      await PatientAllergy.create({
        patientId: testPatient.id,
        allergyId: testAllergy.id,
        reactionId: testReaction.id,
        note: 'Severe allergic reaction',
        recordedDate: new Date().toISOString(),
      });
    });

    it('Should return allergies for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/allergies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const allergy = response.body.data[0];
      expect(allergy).toHaveProperty('id');
      expect(allergy).toHaveProperty('note', 'Severe allergic reaction');
      expect(allergy).toHaveProperty('allergy');
      expect(allergy.allergy).toHaveProperty('name', 'Penicillin');
      expect(allergy).toHaveProperty('reaction');
      expect(allergy.reaction).toHaveProperty('name', 'Rash');
    });

    it('Should handle allergy without reaction gracefully', async () => {
      // Create a new patient for this test
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST003',
          firstName: 'Bob',
          lastName: 'Johnson',
          sex: 'male',
        }),
      );

      await store.models.PatientUser.create({
        email: 'bob@test.com',
        patientId: newPatient.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create allergy reference data
      const testAllergy = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'allergy',
          name: 'Peanuts',
          code: 'PEANUT001',
        }),
      );

      // Create allergy without reaction
      await store.models.PatientAllergy.create({
        patientId: newPatient.id,
        allergyId: testAllergy.id,
        reactionId: null, // No reaction specified
        note: 'Unknown reaction',
        recordedDate: new Date().toISOString(),
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'bob@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/allergies')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const allergy = response.body.data[0];
      expect(allergy).toHaveProperty('id');
      expect(allergy).toHaveProperty('note', 'Unknown reaction');
      expect(allergy).toHaveProperty('allergy');
      expect(allergy.allergy).toHaveProperty('name', 'Peanuts');
      // Reaction should be null when not specified
      expect(allergy.reaction).toBeUndefined();
    });

    it('Should handle allergy with null note gracefully', async () => {
      // Create another patient for this test
      const patientWithNullNote = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PatientUser.create({
        email: 'alice@test.com',
        patientId: patientWithNullNote.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create allergy reference data
      const testAllergy = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'allergy',
          name: 'Shellfish',
          code: 'SHELL001',
        }),
      );

      const testReaction = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'reaction',
          name: 'Swelling',
          code: 'SWELL001',
        }),
      );

      // Create allergy with null note
      await store.models.PatientAllergy.create({
        patientId: patientWithNullNote.id,
        allergyId: testAllergy.id,
        reactionId: testReaction.id,
        note: null, // Null note
        recordedDate: new Date().toISOString(),
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'alice@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/allergies')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const allergy = response.body.data[0];
      expect(allergy).toHaveProperty('id');
      expect(allergy).toHaveProperty('allergy');
      expect(allergy.allergy).toHaveProperty('name', 'Shellfish');
      expect(allergy).toHaveProperty('reaction');
      expect(allergy.reaction).toHaveProperty('name', 'Swelling');
      // Note should be null
      expect(allergy.note).toBeUndefined();
    });

    it('Should return empty array when patient has no allergies', async () => {
      // Create a new patient without allergies
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PatientUser.create({
        email: 'charlie@test.com',
        patientId: newPatient.id,
        role: 'patient',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const loginResponse = await baseApp.post('/api/portal/login').send({
        email: 'charlie@test.com',
      });

      const newAuthToken = loginResponse.body.token;

      const response = await baseApp
        .get('/api/portal/me/allergies')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/allergies');
      expect(response).toHaveRequestError();
    });
  });
});
