import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Surveys GET Endpoints', () => {
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

  // outstanding tests moved to patientSurveys.test.js

  describe('GET /api/portal/me/surveys/:assignmentId', () => {
    it('Should return survey with components for a valid assignment', async () => {
      const { Survey, Program, ProgramDataElement, SurveyScreenComponent, PortalSurveyAssignment, User } = store.models;
      const program = await Program.create(fake(Program));
      const survey = await Survey.create(
        fake(Survey, {
          programId: program.id,
          status: 'active',
        }),
      );
      const pde = await ProgramDataElement.create(
        fake(ProgramDataElement, {
          type: 'Number',
        }),
      );
      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: pde.id,
          surveyId: survey.id,
          config: JSON.stringify({}),
        }),
      );
      const assignedById = (await User.create(fake(User))).id;
      const assignment = await PortalSurveyAssignment.create({
        patientId: testPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        assignedAt: new Date().toISOString(),
        assignedById,
      });

      const response = await baseApp
        .get(`/api/portal/survey/${assignment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({ id: survey.id, components: expect.any(Array) });
      expect(response.body.components.length).toBeGreaterThan(0);
    });

    it('Should return 404 for invalid/mismatched assignment', async () => {
      const res = await baseApp
        .get('/api/portal/survey/not-a-real-id')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res).toHaveRequestError(404);
    });

    it('Should return 404 when assignment belongs to a different patient', async () => {
      const { Survey, Program, ProgramDataElement, SurveyScreenComponent, PortalSurveyAssignment } = store.models;
      const program = await Program.create(fake(Program));
      const survey = await Survey.create(
        fake(Survey, {
          programId: program.id,
          status: 'active',
        }),
      );
      const pde = await ProgramDataElement.create(
        fake(ProgramDataElement, {
          type: 'Number',
        }),
      );
      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: pde.id,
          surveyId: survey.id,
          config: JSON.stringify({}),
        }),
      );

      const otherPatient = await store.models.Patient.create(fake(store.models.Patient));
      const otherAssignment = await PortalSurveyAssignment.create({
        patientId: otherPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
        assignedAt: new Date().toISOString(),
        assignedById: (await store.models.User.create(fake(store.models.User))).id,
      });

      const res = await baseApp
        .get(`/api/portal/survey/${otherAssignment.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res).toHaveRequestError(404);
    });

    it("Should return 404 when assignment isn't outstanding", async () => {
      const { Survey, Program, ProgramDataElement, SurveyScreenComponent, PortalSurveyAssignment, User } = store.models;
      const program = await Program.create(fake(Program));
      const survey = await Survey.create(
        fake(Survey, {
          programId: program.id,
          status: 'active',
        }),
      );
      const pde = await ProgramDataElement.create(
        fake(ProgramDataElement, {
          type: 'Number',
        }),
      );
      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: pde.id,
          surveyId: survey.id,
          config: JSON.stringify({}),
        }),
      );
      const assignedById = (await User.create(fake(User))).id;
      const completedAssignment = await PortalSurveyAssignment.create({
        patientId: testPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED,
        assignedAt: new Date().toISOString(),
        assignedById,
      });

      const res = await baseApp
        .get(`/api/portal/survey/${completedAssignment.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res).toHaveRequestError(404);
    });
  });
});


