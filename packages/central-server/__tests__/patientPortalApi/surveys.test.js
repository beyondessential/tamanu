import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
  let testFacility;
  let assigningUser;

  const createSurveyWithQuestion = async (dataElementType = 'Number', options) => {
    const { Survey, Program, ProgramDataElement, SurveyScreenComponent } = store.models;
    const program = await Program.create(fake(Program));
    const survey = await Survey.create(fake(Survey, { programId: program.id, status: 'active' }));
    const pde = await ProgramDataElement.create(
      fake(ProgramDataElement, { type: dataElementType }),
    );
    await SurveyScreenComponent.create(
      fake(SurveyScreenComponent, {
        dataElementId: pde.id,
        surveyId: survey.id,
        config: JSON.stringify({}),
        ...(options && { options: JSON.stringify(options) }),
      }),
    );
    return survey;
  };

  const assignSurvey = (
    surveyId,
    patientId,
    status = PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
  ) =>
    store.models.PortalSurveyAssignment.create({
      patientId,
      surveyId,
      status,
      assignedAt: new Date().toISOString(),
      assignedById: assigningUser.id,
      facilityId: testFacility.id,
    });

  const getSurvey = surveyId =>
    baseApp.get(`/api/portal/survey/${surveyId}`).set('Authorization', `Bearer ${authToken}`);

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Facility, Patient, PortalUser, ReferenceData, Setting, User } = store.models;

    await Setting.set('features.patientPortal', true);

    // Create a test village
    testVillage = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'village',
        name: 'Test Village',
        code: 'TEST001',
      }),
    );

    testFacility = await Facility.create(fake(Facility));
    assigningUser = await User.create(fake(User));

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
    it('Should return survey with components for a survey assigned to the patient', async () => {
      const survey = await createSurveyWithQuestion();
      const assignment = await assignSurvey(survey.id, testPatient.id);

      const response = await getSurvey(survey.id);

      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        id: survey.id,
        components: expect.any(Array),
        portalSurveyAssignment: { id: assignment.id, facilityId: testFacility.id },
      });
      expect(response.body.components.length).toBeGreaterThan(0);
    });

    it("Should return a question's own option list", async () => {
      const survey = await createSurveyWithQuestion('Select', ['Daily', 'Weekly']);
      await assignSurvey(survey.id, testPatient.id);

      const response = await getSurvey(survey.id);

      expect(response).toHaveSucceeded();
      expect(response.body.components[0].options).toEqual(['Daily', 'Weekly']);
    });

    it('Should not return a survey that is not assigned to the patient', async () => {
      const survey = await createSurveyWithQuestion();

      const response = await getSurvey(survey.id);

      expect(response).toHaveRequestError(404);
    });

    it('Should not return a survey the patient has already completed', async () => {
      const survey = await createSurveyWithQuestion();
      await assignSurvey(survey.id, testPatient.id, PORTAL_SURVEY_ASSIGNMENTS_STATUSES.COMPLETED);

      const response = await getSurvey(survey.id);

      expect(response).toHaveRequestError(404);
    });

    it("Should not expose another patient's assignment", async () => {
      const { Patient } = store.models;
      const otherPatient = await Patient.create(fake(Patient));
      const survey = await createSurveyWithQuestion();
      const ownAssignment = await assignSurvey(survey.id, testPatient.id);
      await assignSurvey(survey.id, otherPatient.id);

      const response = await getSurvey(survey.id);

      expect(response).toHaveSucceeded();
      expect(response.body.portalSurveyAssignment.id).toBe(ownAssignment.id);
      expect(JSON.stringify(response.body)).not.toContain(otherPatient.id);
    });

    it('Should not return a survey only assigned to another patient', async () => {
      const { Patient } = store.models;
      const otherPatient = await Patient.create(fake(Patient));
      const survey = await createSurveyWithQuestion();
      await assignSurvey(survey.id, otherPatient.id);

      const response = await getSurvey(survey.id);

      expect(response).toHaveRequestError(404);
    });
  });
});
