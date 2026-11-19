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

    // A patient of their own with one encounter at another facility, so it doesn't carry into
    // other tests
    const signInPatientWithEncounter = async ({ email, startDate, endDate }) => {
      const { Patient, PortalUser, Facility, Location, Department, User, Encounter } = store.models;
      const patient = await Patient.create(fake(Patient));
      await PortalUser.create({
        email,
        patientId: patient.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      const token = await getPatientAuthToken(baseApp, store.models, email);
      const otherFacility = await Facility.create(fake(Facility));
      const encounter = await Encounter.create(
        fake(Encounter, {
          patientId: patient.id,
          locationId: (await Location.create(fake(Location, { facilityId: otherFacility.id }))).id,
          departmentId: (
            await Department.create(fake(Department, { facilityId: otherFacility.id }))
          ).id,
          examinerId: (await User.create(fake(User))).id,
          startDate,
          endDate,
        }),
      );
      await createAssignment({
        patientId: patient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });
      return { token, encounter };
    };

    const submitAs = token =>
      baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${token}`)
        .send({ surveyId: baseSurvey.id, answers: { [baseDataElement.id]: 4 } });

    it("Should add the response to the patient's open encounter", async () => {
      const { token, encounter } = await signInPatientWithEncounter({
        email: 'admitted-patient@test.com',
        startDate: '2026-01-01 09:00:00',
        endDate: null,
      });

      const response = await submitAs(token);

      expect(response).toHaveSucceeded();
      const surveyResponse = await store.models.SurveyResponse.findByPk(response.body.id);
      expect(surveyResponse.encounterId).toBe(encounter.id);
    });

    it("Should not add the response to the patient's closed encounter", async () => {
      const { token, encounter } = await signInPatientWithEncounter({
        email: 'discharged-patient@test.com',
        startDate: '2026-01-01 09:00:00',
        endDate: '2026-01-02 09:00:00',
      });

      const response = await submitAs(token);

      expect(response).toHaveSucceeded();
      const surveyResponse = await store.models.SurveyResponse.findByPk(response.body.id);
      expect(surveyResponse.encounterId).not.toBe(encounter.id);
      expect(await store.models.Encounter.findByPk(surveyResponse.encounterId)).toMatchObject({
        locationId: testLocationId,
        departmentId: testDepartmentId,
      });
    });

    it('Should record one response, returned to both, when a form is submitted twice at once', async () => {
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

      responses.forEach(response => expect(response).toHaveSucceeded());
      expect(await store.models.SurveyResponse.count({ where: { surveyId: baseSurvey.id } })).toBe(
        1,
      );
      const refreshedAssignment = await store.models.PortalSurveyAssignment.findByPk(assignment.id);
      expect(responses.map(response => response.body.id)).toEqual([
        refreshedAssignment.surveyResponseId,
        refreshedAssignment.surveyResponseId,
      ]);
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

    it("Should run the response's actions at the facility that sent the form", async () => {
      const {
        Facility,
        ProgramDataElement,
        ProgramRegistry,
        ProgramRegistryClinicalStatus,
        SurveyScreenComponent,
        PatientProgramRegistration,
      } = store.models;
      const registry = await ProgramRegistry.create(
        fake(ProgramRegistry, {
          programId: baseSurvey.programId,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        }),
      );
      const clinicalStatus = await ProgramRegistryClinicalStatus.create(
        fake(ProgramRegistryClinicalStatus, { programRegistryId: registry.id }),
      );
      const statusQuestion = await ProgramDataElement.create(
        fake(ProgramDataElement, { type: 'PatientData' }),
      );
      await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
          dataElementId: statusQuestion.id,
          surveyId: baseSurvey.id,
          config: JSON.stringify({ writeToPatient: { fieldName: 'registrationClinicalStatus' } }),
        }),
      );
      const otherFacility = await Facility.create(fake(Facility));
      await createAssignment({
        patientId: testPatient.id,
        surveyId: baseSurvey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      });

      const response = await baseApp
        .post(`/api/portal/surveyResponse`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          surveyId: baseSurvey.id,
          facilityId: otherFacility.id,
          answers: { [statusQuestion.id]: clinicalStatus.id },
        });

      expect(response).toHaveSucceeded();
      const registration = await PatientProgramRegistration.findOne({
        where: { patientId: testPatient.id, programRegistryId: registry.id },
      });
      expect(registration.registeringFacilityId).toBe(testFacility.id);
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
