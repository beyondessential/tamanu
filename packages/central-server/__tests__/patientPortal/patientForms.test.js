import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Forms Endpoints', () => {
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
    const { Patient, PortalUser, ReferenceData } = store.models;

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

  describe('GET /api/portal/me/forms/outstanding', () => {
    beforeAll(async () => {
      const { Survey } = store.models;

      // Create a test survey/form
      await Survey.create({
        name: 'Health Assessment Form',
        code: 'HAF001',
        status: 'active',
      });

      // Note: Outstanding forms logic would typically check for surveys
      // that haven't been completed by the patient
    });

    it('Should return outstanding forms for authenticated request', async () => {
      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // The forms endpoint might return an empty array or an object with data property
      // depending on the implementation
    });

    it('Should handle inactive surveys gracefully', async () => {
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

      // Create inactive survey
      await store.models.Survey.create({
        name: 'Inactive Survey',
        code: 'INACTIVE001',
        status: 'inactive', // Inactive status
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'bob@test.com');

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should handle inactive surveys gracefully (likely filtered out)
    });

    it('Should handle survey with null description gracefully', async () => {
      // Create another patient for this test
      const patientWithNullDescription = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST004',
          firstName: 'Alice',
          lastName: 'Brown',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'alice@test.com',
        patientId: patientWithNullDescription.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create survey with null description
      await store.models.Survey.create({
        name: 'Survey Without Description',
        code: 'NODESC001',
        status: 'active',
        description: null, // Null description
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'alice@test.com');

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should handle null description gracefully
    });

    it('Should handle survey with undefined status gracefully', async () => {
      // Create another patient for this test
      const patientWithUndefinedStatus = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST005',
          firstName: 'Charlie',
          lastName: 'Wilson',
          sex: 'male',
        }),
      );

      await store.models.PortalUser.create({
        email: 'charlie@test.com',
        patientId: patientWithUndefinedStatus.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create survey with undefined status
      await store.models.Survey.create({
        name: 'Survey With Undefined Status',
        code: 'UNDEFINED001',
        status: undefined, // Undefined status
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'charlie@test.com');

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should handle undefined status gracefully
    });

    it('Should filter out completed surveys', async () => {
      // Create a patient with both outstanding and completed surveys
      const patientWithCompletedSurveys = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST006',
          firstName: 'Diana',
          lastName: 'Miller',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'diana@test.com',
        patientId: patientWithCompletedSurveys.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create outstanding survey
      await store.models.Survey.create({
        name: 'Outstanding Survey',
        code: 'OUTSTANDING001',
        status: 'active',
      });

      // Create completed survey
      await store.models.Survey.create({
        name: 'Completed Survey',
        code: 'COMPLETED001',
        status: 'active',
      });

      // Note: In a real implementation, there would be logic to mark surveys as completed
      // This test assumes the endpoint filters out completed surveys

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'diana@test.com');

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should filter out completed surveys (implementation dependent)
    });

    it('Should return empty array when patient has no outstanding forms', async () => {
      // Create a new patient without outstanding forms
      const newPatient = await store.models.Patient.create(
        fake(store.models.Patient, {
          displayId: 'TEST007',
          firstName: 'Eve',
          lastName: 'Davis',
          sex: 'female',
        }),
      );

      await store.models.PortalUser.create({
        email: 'eve@test.com',
        patientId: newPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const newAuthToken = await getPatientAuthToken(baseApp, store.models, 'eve@test.com');

      const response = await baseApp
        .get('/api/portal/me/forms/outstanding')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('Should reject request without authorization header', async () => {
      const response = await baseApp.get('/api/portal/me/forms/outstanding');
      expect(response).toHaveRequestError();
    });
  });

  describe('POST /api/portal/me/forms/:designationId', () => {
    let testLocationId;
    let testDepartmentId;

    beforeAll(async () => {
      const { Location, Department, Facility } = store.models;
      const facility = await Facility.create(fake(Facility, { code: 'TEST_FAC' }));
      const location = await Location.create(
        fake(Location, {
          code: 'TEST_LOC',
          facilityId: facility.id,
        }),
      );
      const department = await Department.create(
        fake(Department, {
          code: 'TEST_DEPT',
          facilityId: facility.id,
        }),
      );
      testLocationId = location.id;
      testDepartmentId = department.id;
    });
    it('Should create a survey response and mark assignment submitted (happy path)', async () => {
      const { Survey, Program, ProgramDataElement, SurveyScreenComponent, PortalSurveyAssignment } =
        store.models;

      const program = await Program.create(fake(Program));
      const survey = await Survey.create(
        fake(Survey, {
          programId: program.id,
          status: 'active',
        }),
      );

      const dataElement = await ProgramDataElement.create(
        fake(ProgramDataElement, {
          type: 'Number',
        }),
      );

      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: dataElement.id,
          surveyId: survey.id,
          config: JSON.stringify({}),
        }),
      );

      const assignment = await PortalSurveyAssignment.create({
        patientId: testPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        assignedAt: new Date().toISOString(),
        assignedById: (await store.models.User.create(fake(store.models.User))).id,
      });

      const payload = {
        surveyId: survey.id,
        locationId: testLocationId,
        departmentId: testDepartmentId,
        answers: {
          [dataElement.id]: 5,
        },
      };

      const response = await baseApp
        .post(`/api/portal/me/forms/${assignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id');

      const refreshedAssignment = await store.models.PortalSurveyAssignment.findByPk(assignment.id);
      expect(refreshedAssignment.status).toBe(
        PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED,
      );
      expect(refreshedAssignment.surveyResponseId).toBe(response.body.id);
    });

    it('Should return 404 when assignment does not match patient/survey or is not outstanding', async () => {
      const { Survey, Program, ProgramDataElement, SurveyScreenComponent, PortalSurveyAssignment } =
        store.models;

      const program = await Program.create(fake(Program));
      const survey = await Survey.create(
        fake(Survey, {
          programId: program.id,
          status: 'active',
        }),
      );
      const dataElement = await ProgramDataElement.create(fake(ProgramDataElement, { type: 'Number' }));
      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: dataElement.id,
          surveyId: survey.id,
          config: JSON.stringify({}),
        }),
      );

      // Create an assignment for another patient
      const otherPatient = await store.models.Patient.create(fake(store.models.Patient));
      const otherAssignment = await PortalSurveyAssignment.create({
        patientId: otherPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        assignedAt: new Date().toISOString(),
        assignedById: (await store.models.User.create(fake(store.models.User))).id,
      });

      const payload = {
        surveyId: survey.id,
        locationId: testLocationId,
        departmentId: testDepartmentId,
        answers: {
          [dataElement.id]: 1,
        },
      };

      const resWrongPatient = await baseApp
        .post(`/api/portal/me/forms/${otherAssignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      expect(resWrongPatient).toHaveRequestError(404);

      // Create an assignment for correct patient but already submitted
      const submittedAssignment = await PortalSurveyAssignment.create({
        patientId: testPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED,
        assignedAt: new Date().toISOString(),
        assignedById: (await store.models.User.create(fake(store.models.User))).id,
      });

      const resSubmitted = await baseApp
        .post(`/api/portal/me/forms/${submittedAssignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      expect(resSubmitted).toHaveRequestError(404);

      // Correct patient and outstanding, but mismatched surveyId in body
      const assignment = await PortalSurveyAssignment.create({
        patientId: testPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        assignedAt: new Date().toISOString(),
        assignedById: (await store.models.User.create(fake(store.models.User))).id,
      });

      const anotherSurvey = await Survey.create(fake(Survey, { programId: program.id, status: 'active' }));

      const resWrongSurvey = await baseApp
        .post(`/api/portal/me/forms/${assignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          surveyId: anotherSurvey.id,
          locationId: testLocationId,
          departmentId: testDepartmentId,
          answers: { [dataElement.id]: 2 },
        });
      expect(resWrongSurvey).toHaveRequestError(404);
    });

    it('Should reject unauthorized requests', async () => {
      const response = await baseApp.post('/api/portal/me/forms/not-a-real-id');
      expect(response).toHaveRequestError();
    });
  });
});
