import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
// import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
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
    const { Patient, PortalUser, ReferenceData, Setting } = store.models;

    await Setting.set('features.patientPortal', true);

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

  describe('GET /api/portal/survey/:surveyId', () => {
    it('Should return survey with components for a valid survey', async () => {
      const { Survey, Program, ProgramDataElement, SurveyScreenComponent } = store.models;
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
      // no assignment gating required for GET by surveyId

      const response = await baseApp
        .get(`/api/portal/survey/${survey.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({ id: survey.id, components: expect.any(Array) });
      expect(response.body.components.length).toBeGreaterThan(0);
    });
  });
});
