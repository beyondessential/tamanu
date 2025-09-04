import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceData,
  randomReferenceId,
} from '@tamanu/database/demoData/patients';
import { randomDate, randomLabRequest, randomSensitiveLabRequest } from '@tamanu/database/demoData';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { createTestContext } from '../utilities';
import { setupSurvey } from '../setupSurvey';

describe('Patient relations', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  describe('programResponses', () => {
    disableHardcodedPermissionsForSuite();

    let permissionApp;

    it('should return empty list if no programResponses', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/programResponses`);
      expect(response.body).toEqual({ count: 0, data: [] });
    });

    it('should return list of programResponses', async () => {
      const { patient, survey } = await setupSurvey({
        models,
        surveyName: 'test-survey-name',
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/programResponses`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].surveyName).toEqual('test-survey-name');
    });

    it('should order by endTime asc by default', async () => {
      const { patient, survey: survey1 } = await setupSurvey({
        models,
        endTime: '2019-01-01 00:00:00',
        surveyName: 'survey-1',
      });
      const { survey: survey2 } = await setupSurvey({
        models,
        endTime: '2019-01-03 00:00:00',
        patientId: patient.id,
        surveyName: 'survey-2',
      });
      const { survey: survey3 } = await setupSurvey({
        models,
        endTime: '2019-01-02 00:00:00',
        patientId: patient.id,
        surveyName: 'survey-3',
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
        ['read', 'Survey', survey2.id],
        ['read', 'Survey', survey3.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/programResponses`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(3);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map(x => x.endTime)).toEqual([
        '2019-01-01 00:00:00',
        '2019-01-02 00:00:00',
        '2019-01-03 00:00:00',
      ]);
    });

    it('should order using query when provided', async () => {
      const { patient, survey: survey1 } = await setupSurvey({
        models,
        surveyName: 'survey-a',
      });

      const { survey: survey2 } = await setupSurvey({
        models,
        surveyName: 'survey-b',
        patientId: patient.id,
      });
      const { survey: survey3 } = await setupSurvey({
        models,
        surveyName: 'survey-c',
        patientId: patient.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
        ['read', 'Survey', survey2.id],
        ['read', 'Survey', survey3.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses?orderBy=surveyName&order=asc`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(3);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map(x => x.surveyName)).toEqual([
        'survey-a',
        'survey-b',
        'survey-c',
      ]);
    });

    it('should return only permitted survey responses', async () => {
      const { patient, survey: survey1 } = await setupSurvey({
        models,
        surveyName: 'survey-d',
      });

      await setupSurvey({
        models,
        surveyName: 'survey-e',
        patientId: patient.id,
      });
      await setupSurvey({
        models,
        surveyName: 'survey-f',
        patientId: patient.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses?orderBy=surveyName&order=asc`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map(x => x.surveyName)).toEqual(['survey-d']);
    });

    it('should filter by procedureId when provided', async () => {
      const { patient, survey, surveyResponse } = await setupSurvey({
        models,
        surveyName: 'procedure-survey',
      });

      const procedure = await models.Procedure.create({
        ...fake(models.Procedure),
        encounterId: surveyResponse.encounterId,
      });

      await models.ProcedureSurveyResponse.create({
        procedureId: procedure.id,
        surveyResponseId: surveyResponse.id,
      });

      // Create another survey response not linked to the procedure
      const { survey: survey2 } = await setupSurvey({
        models,
        surveyName: 'non-procedure-survey',
        patientId: patient.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey.id],
        ['read', 'Survey', survey2.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      // Test without procedureId filter - should return unlinked survey
      const responseWithoutFilter = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses`,
      );
      expect(responseWithoutFilter).toHaveSucceeded();
      expect(responseWithoutFilter.body.count).toEqual(1);
      expect(responseWithoutFilter.body.data[0].surveyName).toEqual('non-procedure-survey');

      // Test with procedureId filter - should return only the procedure-linked response
      const responseWithFilter = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses?procedureId=${procedure.id}`,
      );
      expect(responseWithFilter).toHaveSucceeded();
      expect(responseWithFilter.body.count).toEqual(1);
      expect(responseWithFilter.body.data).toHaveLength(1);
      expect(responseWithFilter.body.data[0].surveyName).toEqual('procedure-survey');
    });

    it('should return empty list when filtering by non-existent procedureId', async () => {
      const { patient, survey } = await setupSurvey({
        models,
        surveyName: 'test-survey',
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const nonExistentProcedureId = 'non-existent-id';
      const response = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses?procedureId=${nonExistentProcedureId}`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(0);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle multiple procedures with survey responses', async () => {
      const {
        patient,
        survey: survey1,
        surveyResponse: surveyResponse1,
      } = await setupSurvey({
        models,
        surveyName: 'procedure-survey-1',
      });

      const { survey: survey2, surveyResponse: surveyResponse2 } = await setupSurvey({
        models,
        surveyName: 'procedure-survey-2',
        patientId: patient.id,
      });

      // Create two procedures
      const procedure1 = await models.Procedure.create({
        ...fake(models.Procedure),
        encounterId: surveyResponse1.encounterId,
      });

      const procedure2 = await models.Procedure.create({
        ...fake(models.Procedure),
        encounterId: surveyResponse2.encounterId,
      });

      // Link each survey response to a different procedure
      await models.ProcedureSurveyResponse.create({
        procedureId: procedure1.id,
        surveyResponseId: surveyResponse1.id,
      });

      await models.ProcedureSurveyResponse.create({
        procedureId: procedure2.id,
        surveyResponseId: surveyResponse2.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
        ['read', 'Survey', survey2.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      // Test filtering by first procedure
      const responseForProcedure1 = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses?procedureId=${procedure1.id}`,
      );
      expect(responseForProcedure1).toHaveSucceeded();
      expect(responseForProcedure1.body.count).toEqual(1);
      expect(responseForProcedure1.body.data[0].surveyName).toEqual('procedure-survey-1');

      // Test filtering by second procedure
      const responseForProcedure2 = await permissionApp.get(
        `/api/patient/${patient.id}/programResponses?procedureId=${procedure2.id}`,
      );
      expect(responseForProcedure2).toHaveSucceeded();
      expect(responseForProcedure2.body.count).toEqual(1);
      expect(responseForProcedure2.body.data[0].surveyName).toEqual('procedure-survey-2');
    });
  });

  describe('referrals', () => {
    disableHardcodedPermissionsForSuite();

    let permissionApp;

    it('should return empty list if no referrals', async () => {
      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const patient = await models.Patient.create(await createDummyPatient(models));
      const response = await permissionApp.get(`/api/patient/${patient.id}/referrals`);
      expect(response.body).toEqual({ count: 0, data: [] });
    });

    it('should return list of referrals', async () => {
      const { patient, referral, survey } = await setupSurvey({ models, withReferral: true });
      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toEqual(referral.id);
    });
    it('should return submissionDate', async () => {
      const { patient, surveyResponseAnswer, survey, referral } = await setupSurvey({
        models,
        withReferral: true,
        submissionDate: '2020-01-01',
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toEqual(referral.id);
      expect(response.body.data[0].surveyResponse.submissionDate).toEqual(
        surveyResponseAnswer.body,
      );
    });
    it('should use endTime if no SubmissionDate answer', async () => {
      const { patient, surveyResponse, survey, referral } = await setupSurvey({
        models,
        withReferral: true,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toEqual(referral.id);
      expect(response.body.data[0].surveyResponse.submissionDate).toEqual(surveyResponse.endTime);
    });
    it('should order by submissionDate asc by default', async () => {
      const { patient, survey: survey1 } = await setupSurvey({
        models,
        withReferral: true,
        submissionDate: '2019-01-01',
      });

      const { survey: survey2 } = await setupSurvey({
        models,
        withReferral: true,
        submissionDate: '2019-01-03',
        patientId: patient.id,
      });
      const { survey: survey3 } = await setupSurvey({
        models,
        withReferral: true,
        submissionDate: '2019-01-02',
        patientId: patient.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
        ['read', 'Survey', survey2.id],
        ['read', 'Survey', survey3.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(`/api/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(3);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map(x => x.surveyResponse.submissionDate)).toEqual([
        '2019-01-01',
        '2019-01-02',
        '2019-01-03',
      ]);
    });
    it('should order by referralType survey name', async () => {
      const { patient, survey: survey1 } = await setupSurvey({
        models,
        withReferral: true,
        surveyName: 'name-c',
      });
      const { survey: survey2 } = await setupSurvey({
        models,
        withReferral: true,
        surveyName: 'name-a',
        patientId: patient.id,
      });
      const { survey: survey3 } = await setupSurvey({
        models,
        withReferral: true,
        surveyName: 'name-b',
        patientId: patient.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
        ['read', 'Survey', survey2.id],
        ['read', 'Survey', survey3.id],
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(
        `/api/patient/${patient.id}/referrals?orderBy=referralType&order=asc`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(3);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map(x => x.surveyResponse.survey.name)).toEqual([
        'name-a',
        'name-b',
        'name-c',
      ]);
    });

    it('should return only permitted referrals', async () => {
      const { patient, survey: survey1 } = await setupSurvey({
        models,
        withReferral: true,
        surveyName: 'name-a',
      });
      const { survey: survey2 } = await setupSurvey({
        models,
        withReferral: true,
        surveyName: 'name-b',
        patientId: patient.id,
      });
      await setupSurvey({
        models,
        withReferral: true,
        surveyName: 'name-c',
        patientId: patient.id,
      });

      const permissions = [
        ['read', 'Patient'],
        ['list', 'SurveyResponse'],
        ['read', 'Survey', survey1.id],
        ['read', 'Survey', survey2.id], // no survey3 so results shouldn't contain survey3
      ];

      permissionApp = await baseApp.asNewRole(permissions);

      const response = await permissionApp.get(
        `/api/patient/${patient.id}/referrals?orderBy=referralType&order=asc`,
      );

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(x => x.surveyResponse.survey.name)).toEqual([
        'name-a',
        'name-b',
      ]);
    });
  });

  describe('issues', () => {
    it('should get an empty list of patient issues', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/api/patient/${patient.id}/issues`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient issues', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientIssue.create({
        patientId: patient.id,
        note: 'include',
        type: 'issue',
      });
      await models.PatientIssue.create({
        patientId: patient.id,
        note: 'include 2',
        type: 'issue',
      });
      await models.PatientIssue.create({
        patientId: otherPatient.id,
        note: 'fail',
        type: 'issue',
      });

      const result = await app.get(`/api/patient/${patient.id}/issues`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });
  });

  describe('allergies', () => {
    it('should get an empty list of patient allergies', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/api/patient/${patient.id}/allergies`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient allergies', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientAllergy.create({
        allergyId: await randomReferenceId(models, 'allergy'),
        patientId: patient.id,
        note: 'include',
      });
      await models.PatientAllergy.create({
        allergyId: await randomReferenceId(models, 'allergy'),
        patientId: patient.id,
        note: 'include 2',
      });
      await models.PatientAllergy.create({
        allergyId: await randomReferenceId(models, 'allergy'),
        patientId: otherPatient.id,
        note: 'fail',
      });

      const result = await app.get(`/api/patient/${patient.id}/allergies`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });

    it('should include reference data', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientAllergy.create({
        allergyId: await randomReferenceId(models, 'allergy'),
        patientId: patient.id,
      });

      const result = await app.get(`/api/patient/${patient.id}/allergies`);
      expect(result).toHaveSucceeded();
      expect(result.body.data[0].allergy).toHaveProperty('name');
    });
  });

  describe('family history', () => {
    it('should get an empty list of history items', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/api/patient/${patient.id}/familyHistory`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient history items', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'diagnosis'),
        patientId: patient.id,
        note: 'include',
      });
      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'diagnosis'),
        patientId: patient.id,
        note: 'include 2',
      });
      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'diagnosis'),
        patientId: otherPatient.id,
        note: 'fail',
      });

      const result = await app.get(`/api/patient/${patient.id}/familyHistory`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });

    it('should include reference data', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'diagnosis'),
        patientId: patient.id,
      });

      const result = await app.get(`/api/patient/${patient.id}/familyHistory`);
      expect(result).toHaveSucceeded();
      expect(result.body.data[0].diagnosis).toHaveProperty('name');
    });
  });

  describe('conditions', () => {
    it('should get an empty list of conditions', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/api/patient/${patient.id}/conditions`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient conditions', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'diagnosis'),
        patientId: patient.id,
        note: 'include',
      });
      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'diagnosis'),
        patientId: patient.id,
        note: 'include 2',
      });
      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'diagnosis'),
        patientId: otherPatient.id,
        note: 'fail',
      });

      const result = await app.get(`/api/patient/${patient.id}/conditions`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });

    it('should include reference data', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'diagnosis'),
        patientId: patient.id,
      });

      const result = await app.get(`/api/patient/${patient.id}/conditions`);
      expect(result).toHaveSucceeded();
      expect(result.body.data[0].condition).toHaveProperty('name');
    });
  });

  describe('secondary IDs', () => {
    it('should get an empty list of patient secondary IDs', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/api/patient/${patient.id}/secondaryId`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient secondary IDs', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));
      const secondaryIdType = await randomReferenceId(models, 'secondaryIdType');

      await models.PatientSecondaryId.create({
        value: 'ABCDEFG',
        visibilityStatus: 'historical',
        typeId: secondaryIdType,
        patientId: patient.id,
      });
      await models.PatientSecondaryId.create({
        value: 'HIJKLMN',
        visibilityStatus: 'current',
        typeId: secondaryIdType,
        patientId: patient.id,
      });
      await models.PatientSecondaryId.create({
        value: 'OPQRSTU',
        visibilityStatus: 'current',
        typeId: secondaryIdType,
        patientId: otherPatient.id,
      });

      const result = await app.get(`/api/patient/${patient.id}/secondaryId`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
    });

    it('should create a new secondary ID', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const idValue = '12345678910';
      const result = await app.post(`/api/patient/${patient.id}/secondaryId`).send({
        value: idValue,
        visibilityStatus: 'current',
        typeId: await randomReferenceId(models, 'secondaryIdType'),
        patientId: patient.id,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.value).toBe(idValue);
    });

    it('should edit a secondary ID', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const secondaryId = await models.PatientSecondaryId.create({
        value: '987654321',
        visibilityStatus: 'current',
        typeId: await randomReferenceId(models, 'secondaryIdType'),
        patientId: patient.id,
      });
      const newVisibilityStatus = 'historical';
      const result = await app
        .put(`/api/patient/${patient.id}/secondaryId/${secondaryId.id}`)
        .send({
          visibilityStatus: newVisibilityStatus,
        });
      expect(result).toHaveSucceeded();
      expect(result.body.visibilityStatus).toBe(newVisibilityStatus);
    });
  });

  describe('fields', () => {
    it('should get a map of definitionIds to values', async () => {
      // Arrange
      const { Patient, PatientFieldDefinitionCategory, PatientFieldDefinition, PatientFieldValue } =
        models;

      const category1 = await PatientFieldDefinitionCategory.create({
        name: 'Test Category 1',
      });
      await PatientFieldDefinitionCategory.create({
        name: 'Test Category 2 (empty)',
      });
      const definition1 = await PatientFieldDefinition.create({
        name: 'Test Field 1',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        categoryId: category1.id,
        options: ['Expected', 'Unexpected', 'Other'],
      });

      const patient = await Patient.create(await createDummyPatient(models));
      await PatientFieldValue.create({
        value: 'Expected',
        definitionId: definition1.id,
        patientId: patient.id,
      });

      const otherPatient = await Patient.create(await createDummyPatient(models));
      await PatientFieldValue.create({
        value: 'Other',
        definitionId: definition1.id,
        patientId: otherPatient.id,
      });

      // Act
      const result = await app.get(`/api/patient/${patient.id}/fields`);

      // Assert
      expect(result).toHaveSucceeded();
      expect(result.body.data).toMatchObject({
        [definition1.id]: 'Expected',
      });
    });

    it('should get field categories and definitions', async () => {
      // Arrange
      const { PatientFieldDefinitionCategory, PatientFieldDefinition } = models;
      await Promise.all([
        PatientFieldDefinitionCategory.truncate({ cascade: true }),
        PatientFieldDefinition.truncate({ cascade: true }),
      ]);
      const category1 = await PatientFieldDefinitionCategory.create({
        name: 'Test Category 1',
      });
      await PatientFieldDefinitionCategory.create({
        name: 'Test Category 2 (empty)',
      });
      const definition1 = await PatientFieldDefinition.create({
        name: 'Test Field 1',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        categoryId: category1.id,
        options: ['a', 'b', 'c'],
      });

      // Act
      const result = await app.get(`/api/patientFieldDefinition`);

      // Assert
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0]).toEqual({
        definitionId: definition1.id,
        name: 'Test Field 1',
        categoryId: category1.id,
        category: 'Test Category 1',
        fieldType: 'string',
        options: ['a', 'b', 'c'],
      });
    });
  });

  describe('labTests', () => {
    let labTestsPatient = null;
    let labTestTypes = [];
    let randomCategory = null;
    const publishedLabTests = [];
    const unpublishedLabTests = [];
    const repeatEntryCount = 5;

    beforeAll(async () => {
      labTestsPatient = await models.Patient.create(await createDummyPatient(models));
      randomCategory = await randomReferenceData(models, 'labTestCategory');
      // Ensure the selected category has at least one test type associated with it
      await models.LabTestType.create({
        ...fake(models.LabTestType),
        labTestCategoryId: randomCategory.id,
      });
      labTestTypes = await models.LabTestType.findAll();
      for (let x = 0; x < repeatEntryCount; ++x) {
        for (let i = 0; i < labTestTypes.length; ++i) {
          const testType = labTestTypes[i];
          const encounter = await models.Encounter.create({
            ...(await createDummyEncounter(models)),
            patientId: labTestsPatient.id,
          });
          const publishedLabRequest = await models.LabRequest.create({
            ...(await randomLabRequest(models, {
              patientId: labTestsPatient.id,
              encounterId: encounter.id,
              status: LAB_REQUEST_STATUSES.PUBLISHED,
              labTestCategoryId: testType.labTestCategoryId,
              sampleTime: randomDate(),
            })),
          });
          const unpublishedLabRequest = await models.LabRequest.create({
            ...(await randomLabRequest(models, {
              patientId: labTestsPatient.id,
              encounterId: encounter.id,
              status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
              sampleTime: randomDate(),
            })),
          });
          const publishedLabTest = await models.LabTest.create({
            labRequestId: publishedLabRequest.id,
            labTestTypeId: testType.id,
          });
          publishedLabTests.push(publishedLabTest.id);
          const unpublishedLabTest = await models.LabTest.create({
            labRequestId: unpublishedLabRequest.id,
            labTestTypeId: testType.id,
          });
          unpublishedLabTests.push(unpublishedLabTest.id);
        }
      }
    });

    it('Defaults to only fetching published lab tests', async () => {
      const response = await app.get(`/api/patient/${labTestsPatient.id}/labTestResults`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(labTestTypes.length);
      response.body.data.forEach(testResults => {
        Object.values(testResults.results).forEach(res =>
          expect(publishedLabTests).toContain(res.id),
        );
      });
    });

    it('Allows overriding the status filter', async () => {
      const response = await app.get(
        `/api/patient/${labTestsPatient.id}/labTestResults?status=${LAB_REQUEST_STATUSES.RECEPTION_PENDING}`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(labTestTypes.length);
      response.body.data.forEach(testResults => {
        Object.values(testResults.results).forEach(res =>
          expect(unpublishedLabTests).toContain(res.id),
        );
      });
    });

    it('Fetches lab tests across multiple categories', async () => {
      const response = await app.get(`/api/patient/${labTestsPatient.id}/labTestResults`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(labTestTypes.length);
      const uniqueCategories = [...new Set(response.body.data.map(x => x.testCategory))];
      expect(uniqueCategories.length).toBeGreaterThan(1);
    });

    it('Allows filtering lab tests by category', async () => {
      const response = await app.get(
        `/api/patient/${labTestsPatient.id}/labTestResults?categoryId=${randomCategory.id}`,
      );
      expect(response).toHaveSucceeded();
      response.body.data.forEach(labTest => {
        expect(labTest.testCategory).toEqual(randomCategory.name);
      });
    });

    it('excludes sensitive lab test results', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: labTestsPatient.id,
      });
      const labRequestData = await randomSensitiveLabRequest(models, {
        patientId: labTestsPatient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        sampleTime: randomDate(),
      });
      await models.LabRequest.createWithTests(labRequestData);

      const response = await app.get(`/api/patient/${labTestsPatient.id}/labTestResults`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(10);
      expect(response.body.data.length).toEqual(10);
    });

    test.todo('Allows filtering lab tests by panel');
  });
});
