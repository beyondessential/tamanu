import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
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

    // The assigning facility's default location and department for form encounters
    const location = await Location.create(
      fake(Location, { code: 'PORTAL_TEST_LOC', facilityId: testFacility.id }),
    );
    const department = await Department.create(
      fake(Department, { code: 'PORTAL_TEST_DEPT', facilityId: testFacility.id }),
    );
    await Setting.set(
      'survey.defaultCodes',
      { location: location.code, department: department.code },
      SETTINGS_SCOPES.FACILITY,
      testFacility.id,
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

    it('Should record the response against the signed-in patient and assigning facility, whatever the body names', async () => {
      const { Patient, Facility, Location, Department, SurveyResponse, Encounter } = store.models;
      await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });
      const otherPatient = await Patient.create(fake(Patient));
      const otherFacility = await Facility.create(fake(Facility));
      const otherLocation = await Location.create(fake(Location, { facilityId: otherFacility.id }));
      const otherDepartment = await Department.create(
        fake(Department, { facilityId: otherFacility.id }),
      );

      const response = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          surveyId: baseSurvey.id,
          patientId: otherPatient.id,
          facilityId: otherFacility.id,
          locationId: otherLocation.id,
          departmentId: otherDepartment.id,
          answers: { [baseDataElement.id]: 3 },
        });

      expect(response).toHaveSucceeded();
      const surveyResponse = await SurveyResponse.findByPk(response.body.id);
      const encounter = await Encounter.findByPk(surveyResponse.encounterId);
      expect(encounter).toMatchObject({
        patientId: testPatient.id,
        locationId: testLocationId,
        departmentId: testDepartmentId,
      });
      expect(await Encounter.count({ where: { patientId: otherPatient.id } })).toBe(0);
    });

    it("Should add the response to the patient's open encounter", async () => {
      const {
        Patient,
        PortalUser,
        Facility,
        Location,
        Department,
        User,
        Encounter,
        SurveyResponse,
      } = store.models;
      // A patient of their own, so the open encounter doesn't carry into other tests
      const admittedPatient = await Patient.create(fake(Patient));
      const email = 'admitted-patient@test.com';
      await PortalUser.create({
        email,
        patientId: admittedPatient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      const admittedPatientToken = await getPatientAuthToken(baseApp, store.models, email);
      const admittingFacility = await Facility.create(fake(Facility));
      const openEncounter = await Encounter.create(
        fake(Encounter, {
          patientId: admittedPatient.id,
          locationId: (await Location.create(fake(Location, { facilityId: admittingFacility.id })))
            .id,
          departmentId: (
            await Department.create(fake(Department, { facilityId: admittingFacility.id }))
          ).id,
          examinerId: (await User.create(fake(User))).id,
          endDate: null,
        }),
      );
      await createAssignment({
        patientId: admittedPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });

      const response = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${admittedPatientToken}`)
        .send({ surveyId: baseSurvey.id, answers: { [baseDataElement.id]: 4 } });

      expect(response).toHaveSucceeded();
      const surveyResponse = await SurveyResponse.findByPk(response.body.id);
      expect(surveyResponse.encounterId).toBe(openEncounter.id);
    });

    it('Should record only one response when a form is submitted twice at once', async () => {
      const assignment = await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });
      const submit = () =>
        baseApp
          .post(`/api/portal/surveyResponse`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ surveyId: baseSurvey.id, answers: { [baseDataElement.id]: 6 } });

      const responses = await Promise.all([submit(), submit()]);

      expect(responses.map(response => response.status).sort()).toEqual([200, 404]);
      expect(await store.models.SurveyResponse.count({ where: { surveyId: baseSurvey.id } })).toBe(
        1,
      );
      const refreshedAssignment = await store.models.PortalSurveyAssignment.findByPk(assignment.id);
      expect(refreshedAssignment.surveyResponseId).toBe(
        responses.find(response => response.status === 200).body.id,
      );
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
          answers: { [baseDataElement.id]: 2 },
        });
      expect(resWrongSurvey).toHaveRequestError(404);
    });

    it('Should record a drug chosen in a search question as the answer', async () => {
      const { ProgramDataElement, ReferenceData, SurveyScreenComponent, SurveyResponseAnswer } =
        store.models;
      const drugQuestion = await ProgramDataElement.create(
        fake(ProgramDataElement, { type: 'Autocomplete' }),
      );
      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: drugQuestion.id,
          surveyId: baseSurvey.id,
          config: JSON.stringify({ source: 'ReferenceData', where: { type: 'drug' } }),
        }),
      );
      const drug = await ReferenceData.create(fake(ReferenceData, { type: 'drug' }));
      await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });

      const response = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ surveyId: baseSurvey.id, answers: { [drugQuestion.id]: drug.id } });

      expect(response).toHaveSucceeded();
      const answer = await SurveyResponseAnswer.findOne({
        where: { responseId: response.body.id, dataElementId: drugQuestion.id },
      });
      expect(answer.body).toBe(drug.id);
    });

    it('Should reject a body without a survey or answers', async () => {
      await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });
      const submit = body =>
        baseApp
          .post(`/api/portal/surveyResponse`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(body);

      expect(await submit({ answers: { [baseDataElement.id]: 1 } })).toHaveRequestError();
      expect(await submit({ surveyId: baseSurvey.id })).toHaveRequestError();
      expect(await store.models.SurveyResponse.count({ where: { surveyId: baseSurvey.id } })).toBe(
        0,
      );
    });

    it('Should reject unauthorized requests', async () => {
      const response = await baseApp.post('/api/portal/surveyResponse');
      expect(response).toHaveRequestError();
    });
  });
});
