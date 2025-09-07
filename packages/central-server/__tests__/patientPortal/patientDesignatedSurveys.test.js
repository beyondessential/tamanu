import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { getPatientAuthToken } from './patientPortalUtils';

const TEST_PATIENT_EMAIL = 'patient@test.com';

describe('Patient Portal Designated Surveys Endpoints', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let authToken;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser } = store.models;

    testPatient = await Patient.create(fake(Patient));

    await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    });

    authToken = await getPatientAuthToken(baseApp, store.models, TEST_PATIENT_EMAIL);
  });

  afterAll(async () => close());

  describe('POST /api/portal/me/surveys/:designationId', () => {
    it('creates a survey response and marks assignment submitted (happy path)', async () => {
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
        answers: {
          [dataElement.id]: 5,
        },
      };

      const response = await baseApp
        .post(`/api/portal/me/surveys/${assignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('id');

      const refreshedAssignment = await store.models.PortalSurveyAssignment.findByPk(assignment.id);
      expect(refreshedAssignment.status).toBe(
        PORTAL_SURVEY_ASSIGNMENTS_STATUSES.SUBMITTED,
      );
      expect(refreshedAssignment.surveyResponseId).toBe(response.body.id);
    });

    it('returns 404 when assignment does not match patient/survey or is not outstanding', async () => {
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
        answers: {
          [dataElement.id]: 1,
        },
      };

      const resWrongPatient = await baseApp
        .post(`/api/portal/me/surveys/${otherAssignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      expect(resWrongPatient).toHaveRequestError(404);

      // Create an assignment for correct patient but already submitted
      const submittedAssignment = await PortalSurveyAssignment.create({
        patientId: testPatient.id,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.SUBMITTED,
        assignedAt: new Date().toISOString(),
        assignedById: (await store.models.User.create(fake(store.models.User))).id,
      });

      const resSubmitted = await baseApp
        .post(`/api/portal/me/surveys/${submittedAssignment.id}`)
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
        .post(`/api/portal/me/surveys/${assignment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ surveyId: anotherSurvey.id, answers: { [dataElement.id]: 2 } });
      expect(resWrongSurvey).toHaveRequestError(404);
    });

    it('rejects unauthorized requests', async () => {
      const response = await baseApp.post('/api/portal/me/surveys/not-a-real-id');
      expect(response).toHaveRequestError();
    });
  });
});


