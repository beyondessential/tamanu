import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Survey Response POST Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;
  let testVillage;
  let testLocationId;
  let testDepartmentId;
  let baseSurvey;
  let baseDataElement;
  let testFacility;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, ReferenceData, Location, Department, Facility, Setting } =
      store.models;

    await Setting.set('features.patientPortal', true);

    testFacility = await Facility.create(
      fake(Facility, {
        name: 'Test Facility',
        code: 'TESTFACILITY',
      }),
    );

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

    // Location/Department setup
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

  afterAll(async () => close());

  const createSurveySetup = async () => {
    const { Survey, Program, ProgramDataElement, SurveyScreenComponent } = store.models;
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
    return { survey, dataElement };
  };

  const createAssignment = async ({ patientId, surveyId, status }) => {
    const assignedById = (await store.models.User.create(fake(store.models.User))).id;
    return store.models.PortalSurveyAssignment.create({
      patientId,
      surveyId,
      status,
      assignedAt: new Date().toISOString(),
      assignedById,
      facilityId: testFacility.id,
    });
  };

  beforeEach(async () => {
    const setup = await createSurveySetup();
    baseSurvey = setup.survey;
    baseDataElement = setup.dataElement;
  });

  describe('POST /api/portal/me/surveys', () => {
    it('Should create a survey response and mark assignment submitted', async () => {
      const assignment = await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });

      const payload = {
        surveyId: baseSurvey.id,
        locationId: testLocationId,
        departmentId: testDepartmentId,
        patientId: testPatient.id,
        answers: {
          [baseDataElement.id]: 5,
        },
      };

      const response = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id');

      const refreshedAssignment = await store.models.PortalSurveyAssignment.findByPk(assignment.id);
      expect(refreshedAssignment.status).toBe(PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED);
      expect(refreshedAssignment.surveyResponseId).toBe(response.body.id);
    });

    it('Should return 404 when assignment does not match patient/survey or is not outstanding', async () => {
      const { Survey } = store.models;

      // Create an assignment for another patient
      const otherPatient = await store.models.Patient.create(fake(store.models.Patient));
      await createAssignment({
        patientId: otherPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });

      const payload = {
        surveyId: baseSurvey.id,
        locationId: testLocationId,
        departmentId: testDepartmentId,
        patientId: testPatient.id,
        answers: {
          [baseDataElement.id]: 1,
        },
      };

      const resWrongPatient = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      expect(resWrongPatient).toHaveRequestError(404);

      // Create an assignment for correct patient but already submitted
      await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED,
      });

      const resSubmitted = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      expect(resSubmitted).toHaveRequestError(404);

      // Correct patient and outstanding, but mismatched surveyId in body
      await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });

      const anotherSurvey = await Survey.create(fake(Survey, { status: 'active' }));

      const resWrongSurvey = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          surveyId: anotherSurvey.id,
          patientId: testPatient.id,
          locationId: testLocationId,
          departmentId: testDepartmentId,
          answers: { [baseDataElement.id]: 2 },
        });
      expect(resWrongSurvey).toHaveRequestError(404);
    });

    it('Should reject unauthorized requests', async () => {
      const response = await baseApp.post('/api/portal/surveyResponse');
      expect(response).toHaveRequestError();
    });
  });
});
