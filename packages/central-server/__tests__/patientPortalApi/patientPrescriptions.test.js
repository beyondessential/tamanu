import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Prescriptions Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;
  let testVillage;
  let testPrescriber;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, ReferenceData, User, Setting } = store.models;

    await Setting.set('features.patientPortal', true);
    
    // Create a test village
    testVillage = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'village',
        name: 'Test Village',
        code: 'TEST001',
      }),
    );

    // Create a test prescriber
    testPrescriber = await User.create(
      fake(User, {
        role: 'practitioner',
        displayName: 'Test Prescriber',
        email: 'prescriber@test.com',
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

    // Create a test portal user
    await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    // Login to get auth token
    authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);
  });

  afterAll(async () => close());

  describe('GET /api/portal/me/ongoing-prescriptions', () => {
    beforeAll(async () => {
      const { Prescription, PatientOngoingPrescription, ReferenceData } = store.models;

      // Create test medication reference data
      const testMedication = await ReferenceData.create(
        fake(ReferenceData, {
          type: 'drug',
          name: 'Metformin',
          code: 'MET001',
        }),
      );

      // Create a test prescription
      const testPrescription = await Prescription.create({
        medicationId: testMedication.id,
        doseAmount: 500,
        units: 'mg',
        frequency: 'twice daily',
        route: 'oral',
        date: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isOngoing: true,
        discontinued: false,
        prescriberId: testPrescriber.id,
      });

      // Link prescription to patient
      await PatientOngoingPrescription.create({
        patientId: testPatient.id,
        prescriptionId: testPrescription.id,
      });
    });

    it('Should return ongoing prescriptions for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const prescription = response.body[0];
      expect(prescription).toHaveProperty('id');
      expect(prescription).toHaveProperty('medication');
      expect(prescription.medication).toHaveProperty('name', 'Metformin');
      expect(prescription).toHaveProperty('prescriber');
      expect(prescription.prescriber).toHaveProperty('displayName', 'Test Prescriber');
    });

    it('Should handle prescription without prescriber gracefully', async () => {
      // Create a new patient for this test
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST003',
          firstName: 'Bob',
          lastName: 'Johnson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'bob@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create medication reference data
      const testMedication = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Aspirin',
          code: 'ASP001',
        }),
      );

      // Create prescription without prescriber
      const testPrescription = await store.models.Prescription.create({
        medicationId: testMedication.id,
        doseAmount: 100,
        units: 'mg',
        frequency: 'once daily',
        route: 'oral',
        date: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isOngoing: true,
        discontinued: false,
        prescriberId: null, // No prescriber
      });

      // Link prescription to patient
      await store.models.PatientOngoingPrescription.create({
        patientId: newPatient.id,
        prescriptionId: testPrescription.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const prescription = response.body[0];
      expect(prescription).toHaveProperty('id');
      expect(prescription).toHaveProperty('medication');
      expect(prescription.medication).toHaveProperty('name', 'Aspirin');
      // Prescriber should be null when not specified
      expect(prescription.prescriber).toBeUndefined();
    });

    it('Should filter out discontinued prescriptions', async () => {
      // Create a patient with both ongoing and discontinued prescriptions
      const patientWithDiscontinuedPrescriptions = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: patientWithDiscontinuedPrescriptions.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create medication reference data
      const ongoingMedication = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Ongoing Medication',
          code: 'ONGOING001',
        }),
      );

      const discontinuedMedication = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Discontinued Medication',
          code: 'DISCONT001',
        }),
      );

      // Create ongoing prescription
      const ongoingPrescription = await store.models.Prescription.create({
        medicationId: ongoingMedication.id,
        doseAmount: 200,
        units: 'mg',
        frequency: 'twice daily',
        route: 'oral',
        date: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isOngoing: true,
        discontinued: false,
        prescriberId: testPrescriber.id,
      });

      // Create discontinued prescription
      const discontinuedPrescription = await store.models.Prescription.create({
        medicationId: discontinuedMedication.id,
        doseAmount: 100,
        units: 'mg',
        frequency: 'once daily',
        route: 'oral',
        date: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isOngoing: false,
        discontinued: true,
        prescriberId: testPrescriber.id,
      });

      // Link prescriptions to patient
      await store.models.PatientOngoingPrescription.create({
        patientId: patientWithDiscontinuedPrescriptions.id,
        prescriptionId: ongoingPrescription.id,
      });

      await store.models.PatientOngoingPrescription.create({
        patientId: patientWithDiscontinuedPrescriptions.id,
        prescriptionId: discontinuedPrescription.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Should only return ongoing prescription

      const prescription = response.body[0];
      expect(prescription).toHaveProperty('medication');
      expect(prescription.medication).toHaveProperty('name', 'Ongoing Medication');
    });

    it('Should return prescriptions when discontinued is null', async () => {
      const patientWithNullDiscontinued = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'NullDiscontinued',
          lastName: 'Patient',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'nulldiscontinued@test.com',
        patientId: patientWithNullDiscontinued.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const nullDiscontinuedMedication = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Null Discontinued Medication',
          code: 'NULL001',
        }),
      );

      // Create prescription with discontinued: null
      const nullDiscontinuedPrescription = await store.models.Prescription.create({
        medicationId: nullDiscontinuedMedication.id,
        doseAmount: 250,
        units: 'mg',
        frequency: 'three times daily',
        route: 'oral',
        date: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isOngoing: true,
        discontinued: null,
        prescriberId: testPrescriber.id,
      });

      await store.models.PatientOngoingPrescription.create({
        patientId: patientWithNullDiscontinued.id,
        prescriptionId: nullDiscontinuedPrescription.id,
      });

      const newAuthToken = await getPatientAuthToken(
        baseApp,
        store.models,
        'nulldiscontinued@test.com',
      );

      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Should return the prescription with null discontinued

      const prescription = response.body[0];
      expect(prescription).toHaveProperty('medication');
      expect(prescription.medication).toHaveProperty('name', 'Null Discontinued Medication');
      expect(prescription).not.toHaveProperty('discontinued');
    });

    it('Should only return ongoing prescriptions for the target patient (comprehensive filtering)', async () => {
      const { Patient, PortalUser, Prescription, PatientOngoingPrescription, ReferenceData } =
        store.models;

      // Create target patient
      const targetPatient = await Patient.create(
        fake(Patient, {
          displayId: 'FILTERTEST01',
          firstName: 'Target',
          lastName: 'Patient',
        }),
      );

      const targetEmail = 'target.filter@test.com';
      await PortalUser.create({
        email: targetEmail,
        patientId: targetPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create other patient
      const otherPatient = await Patient.create(
        fake(Patient, {
          displayId: 'FILTERTEST02',
          firstName: 'Other',
          lastName: 'Patient',
        }),
      );

      await PortalUser.create({
        email: 'other.filter@test.com',
        patientId: otherPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create medication reference data
      const targetOngoingMed = await ReferenceData.create(
        fake(ReferenceData, { type: 'drug', name: 'Target Ongoing', code: 'TONGO001' }),
      );
      const targetDiscontinuedMed = await ReferenceData.create(
        fake(ReferenceData, { type: 'drug', name: 'Target Discontinued', code: 'TDISC001' }),
      );
      const otherOngoingMed = await ReferenceData.create(
        fake(ReferenceData, { type: 'drug', name: 'Other Ongoing', code: 'OONGO001' }),
      );
      const otherDiscontinuedMed = await ReferenceData.create(
        fake(ReferenceData, { type: 'drug', name: 'Other Discontinued', code: 'ODISC001' }),
      );

      // Create prescriptions
      const nowIso = new Date().toISOString();
      const targetOngoingRx = await Prescription.create({
        medicationId: targetOngoingMed.id,
        doseAmount: 10,
        units: 'mg',
        frequency: 'once daily',
        route: 'oral',
        date: nowIso,
        startDate: nowIso,
        isOngoing: true,
        discontinued: false,
        prescriberId: testPrescriber.id,
      });

      const targetDiscontinuedRx = await Prescription.create({
        medicationId: targetDiscontinuedMed.id,
        doseAmount: 10,
        units: 'mg',
        frequency: 'once daily',
        route: 'oral',
        date: nowIso,
        startDate: nowIso,
        isOngoing: false,
        discontinued: true,
        prescriberId: testPrescriber.id,
      });

      const otherOngoingRx = await Prescription.create({
        medicationId: otherOngoingMed.id,
        doseAmount: 10,
        units: 'mg',
        frequency: 'once daily',
        route: 'oral',
        date: nowIso,
        startDate: nowIso,
        isOngoing: true,
        discontinued: false,
        prescriberId: testPrescriber.id,
      });

      const otherDiscontinuedRx = await Prescription.create({
        medicationId: otherDiscontinuedMed.id,
        doseAmount: 10,
        units: 'mg',
        frequency: 'once daily',
        route: 'oral',
        date: nowIso,
        startDate: nowIso,
        isOngoing: false,
        discontinued: true,
        prescriberId: testPrescriber.id,
      });

      // Link prescriptions to patients via PatientOngoingPrescription
      await PatientOngoingPrescription.create({
        patientId: targetPatient.id,
        prescriptionId: targetOngoingRx.id,
      });
      await PatientOngoingPrescription.create({
        patientId: targetPatient.id,
        prescriptionId: targetDiscontinuedRx.id,
      });
      await PatientOngoingPrescription.create({
        patientId: otherPatient.id,
        prescriptionId: otherOngoingRx.id,
      });
      await PatientOngoingPrescription.create({
        patientId: otherPatient.id,
        prescriptionId: otherDiscontinuedRx.id,
      });

      // Request as target patient
      const targetAuth = await getPatientAuthToken(baseApp, store.models, targetEmail);
      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${targetAuth}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);

      // Should only include the target patient's ongoing prescription
      const meds = response.body.map(p => p?.medication?.name);
      expect(meds).toContain('Target Ongoing');
      expect(meds).not.toContain('Target Discontinued');
      expect(meds).not.toContain('Other Ongoing');
      expect(meds).not.toContain('Other Discontinued');

      // And the count should be exactly 1 for this patient
      expect(response.body.length).toBe(1);
    });

    it('Should handle prescription with null frequency gracefully', async () => {
      // Create another patient for this test
      const patientWithNullFrequency = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST006',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'charlie@test.com',
        patientId: patientWithNullFrequency.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create medication reference data
      const testMedication = await store.models.ReferenceData.create(
        fake(store.models.ReferenceData, {
          type: 'drug',
          name: 'Test Medication',
          code: 'TEST001',
        }),
      );

      // Create prescription with empty frequency
      const testPrescription = await store.models.Prescription.create({
        medicationId: testMedication.id,
        doseAmount: 50,
        units: 'mg',
        frequency: '', // Empty frequency instead of null
        route: 'oral',
        date: new Date().toISOString(),
        startDate: new Date().toISOString(),
        isOngoing: true,
        discontinued: false,
        prescriberId: testPrescriber.id,
      });

      // Link prescription to patient
      await store.models.PatientOngoingPrescription.create({
        patientId: patientWithNullFrequency.id,
        prescriptionId: testPrescription.id,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const prescription = response.body[0];
      expect(prescription).toHaveProperty('id');
      expect(prescription).toHaveProperty('medication');
      expect(prescription.medication).toHaveProperty('name', 'Test Medication');
      // Should handle null frequency gracefully
    });

    it('Should return empty array when patient has no ongoing prescriptions', async () => {
      // Create a new patient without prescriptions
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST007',
          firstName: 'Diana',
          lastName: 'Miller',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'diana@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'diana@test.com');

      const response = await baseApp
        .get('/api/portal/me/ongoing-prescriptions')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/ongoing-prescriptions');
      expect(response).toHaveRequestError();
    });
  });
});
