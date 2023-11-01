import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
  randomReferenceData,
} from '@tamanu/shared/demoData/patients';
import { randomLabRequest, randomDate } from '@tamanu/shared/demoData';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { Chance } from 'chance';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { createTestContext } from '../utilities';

const chance = new Chance();

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
  const setupSurvey = async ({
    surveyName = chance.word(),
    programName = chance.word(),
    submissionDate = null,
    endTime = getCurrentDateTimeString(),
    patientId,
    withReferral,
  } = {}) => {
    let patient = { id: patientId };
    if (!patientId) {
      patient = await models.Patient.create(await createDummyPatient(models));
    }
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const program = await models.Program.create({
      name: programName,
    });
    const survey = await models.Survey.create({
      programId: program.id,
      name: surveyName,
    });

    const surveyResponse = await models.SurveyResponse.create({
      surveyId: survey.id,
      encounterId: encounter.id,
      endTime,
    });

    const dataElement =
      withReferral &&
      (await models.ProgramDataElement.create({
        ...fake(models.ProgramDataElement),
        type: 'SubmissionDate',
      }));

    const surveyResponseAnswer =
      withReferral &&
      (await models.SurveyResponseAnswer.create({
        ...fake(models.SurveyResponseAnswer),
        dataElementId: dataElement.id,
        responseId: surveyResponse.id,
        body: submissionDate,
      }));

    const referral =
      withReferral &&
      (await models.Referral.create({
        initiatingEncounterId: encounter.id,
        surveyResponseId: surveyResponse.id,
      }));

    return { patient, encounter, surveyResponse, program, surveyResponseAnswer, referral };
  };

  describe('programResponses', () => {
    it('should return empty list if no programResponses', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const response = await app.get(`/v1/patient/${patient.id}/programResponses`);
      expect(response.body).toEqual({ count: 0, data: [] });
    });

    it('should return list of programResponses', async () => {
      const { patient } = await setupSurvey({
        surveyName: 'test-survey-name',
      });
      const response = await app.get(`/v1/patient/${patient.id}/programResponses`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].surveyName).toEqual('test-survey-name');
    });

    it('should order by endTime asc by default', async () => {
      const { patient } = await setupSurvey({
        endTime: '2019-01-01 00:00:00',
      });
      await setupSurvey({
        endTime: '2019-01-03 00:00:00',
        patientId: patient.id,
      });
      await setupSurvey({
        endTime: '2019-01-02 00:00:00',
        patientId: patient.id,
      });
      const response = await app.get(`/v1/patient/${patient.id}/programResponses`);
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
      const { patient } = await setupSurvey({
        surveyName: 'survey-a',
      });
      await setupSurvey({
        surveyName: 'survey-c',
        patientId: patient.id,
      });
      await setupSurvey({
        surveyName: 'survey-b',
        patientId: patient.id,
      });
      const response = await app.get(
        `/v1/patient/${patient.id}/programResponses?orderBy=surveyName&order=asc`,
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
  });

  describe('referrals', () => {
    it('should return empty list if no referrals', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const response = await app.get(`/v1/patient/${patient.id}/referrals`);
      expect(response.body).toEqual({ count: 0, data: [] });
    });

    it('should return list of referrals', async () => {
      const { patient, referral } = await setupSurvey({ withReferral: true });
      const response = await app.get(`/v1/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toEqual(referral.id);
    });
    it('should return submissionDate', async () => {
      const { patient, surveyResponseAnswer, referral } = await setupSurvey({
        withReferral: true,
        submissionDate: '2020-01-01',
      });

      const response = await app.get(`/v1/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toEqual(referral.id);
      expect(response.body.data[0].surveyResponse.submissionDate).toEqual(
        surveyResponseAnswer.body,
      );
    });
    it('should use endTime if no SubmissionDate answer', async () => {
      const { patient, surveyResponse, referral } = await setupSurvey({
        withReferral: true,
      });
      const response = await app.get(`/v1/patient/${patient.id}/referrals`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toEqual(referral.id);
      expect(response.body.data[0].surveyResponse.submissionDate).toEqual(surveyResponse.endTime);
    });
    it('should order by submissionDate asc by default', async () => {
      const { patient } = await setupSurvey({
        withReferral: true,
        submissionDate: '2019-01-01',
      });
      await setupSurvey({
        withReferral: true,
        submissionDate: '2019-01-03',
        patientId: patient.id,
      });
      await setupSurvey({
        withReferral: true,
        submissionDate: '2019-01-02',
        patientId: patient.id,
      });
      const response = await app.get(`/v1/patient/${patient.id}/referrals`);
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
      const { patient } = await setupSurvey({
        withReferral: true,
        surveyName: 'name-c',
      });
      await setupSurvey({
        withReferral: true,
        surveyName: 'name-a',
        patientId: patient.id,
      });
      await setupSurvey({
        withReferral: true,
        surveyName: 'name-b',
        patientId: patient.id,
      });
      const response = await app.get(
        `/v1/patient/${patient.id}/referrals?orderBy=referralType&order=asc`,
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
  });

  describe('issues', () => {
    it('should get an empty list of patient issues', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/v1/patient/${patient.id}/issues`);
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

      const result = await app.get(`/v1/patient/${patient.id}/issues`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });
  });

  describe('allergies', () => {
    it('should get an empty list of patient allergies', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/v1/patient/${patient.id}/allergies`);
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

      const result = await app.get(`/v1/patient/${patient.id}/allergies`);
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

      const result = await app.get(`/v1/patient/${patient.id}/allergies`);
      expect(result).toHaveSucceeded();
      expect(result.body.data[0].allergy).toHaveProperty('name');
    });
  });

  describe('family history', () => {
    it('should get an empty list of history items', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/v1/patient/${patient.id}/familyHistory`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient history items', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'icd10'),
        patientId: patient.id,
        note: 'include',
      });
      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'icd10'),
        patientId: patient.id,
        note: 'include 2',
      });
      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'icd10'),
        patientId: otherPatient.id,
        note: 'fail',
      });

      const result = await app.get(`/v1/patient/${patient.id}/familyHistory`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });

    it('should include reference data', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientFamilyHistory.create({
        diagnosisId: await randomReferenceId(models, 'icd10'),
        patientId: patient.id,
      });

      const result = await app.get(`/v1/patient/${patient.id}/familyHistory`);
      expect(result).toHaveSucceeded();
      expect(result.body.data[0].diagnosis).toHaveProperty('name');
    });
  });

  describe('conditions', () => {
    it('should get an empty list of conditions', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/v1/patient/${patient.id}/conditions`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(0);
    });

    it('should get a list of patient conditions', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const otherPatient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'icd10'),
        patientId: patient.id,
        note: 'include',
      });
      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'icd10'),
        patientId: patient.id,
        note: 'include 2',
      });
      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'icd10'),
        patientId: otherPatient.id,
        note: 'fail',
      });

      const result = await app.get(`/v1/patient/${patient.id}/conditions`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.every(x => x.note.includes('include'))).toEqual(true);
    });

    it('should include reference data', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      await models.PatientCondition.create({
        conditionId: await randomReferenceId(models, 'icd10'),
        patientId: patient.id,
      });

      const result = await app.get(`/v1/patient/${patient.id}/conditions`);
      expect(result).toHaveSucceeded();
      expect(result.body.data[0].condition).toHaveProperty('name');
    });
  });

  describe('secondary IDs', () => {
    it('should get an empty list of patient secondary IDs', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));

      const result = await app.get(`/v1/patient/${patient.id}/secondaryId`);
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

      const result = await app.get(`/v1/patient/${patient.id}/secondaryId`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
    });

    it('should create a new secondary ID', async () => {
      const patient = await models.Patient.create(await createDummyPatient(models));
      const idValue = '12345678910';
      const result = await app.post(`/v1/patient/${patient.id}/secondaryId`).send({
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
      const result = await app.put(`/v1/patient/${patient.id}/secondaryId/${secondaryId.id}`).send({
        visibilityStatus: newVisibilityStatus,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.visibilityStatus).toBe(newVisibilityStatus);
    });
  });

  describe('fields', () => {
    it('should get a map of definitionIds to values', async () => {
      // Arrange
      const {
        Patient,
        PatientFieldDefinitionCategory,
        PatientFieldDefinition,
        PatientFieldValue,
      } = models;

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
      const result = await app.get(`/v1/patient/${patient.id}/fields`);

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
        PatientFieldDefinitionCategory.truncate({ cascade: true, force: true }),
        PatientFieldDefinition.truncate({ cascade: true, force: true }),
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
      const result = await app.get(`/v1/patientFieldDefinition`);

      // Assert
      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0]).toEqual({
        definitionId: definition1.id,
        name: 'Test Field 1',
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
      const response = await app.get(`/v1/patient/${labTestsPatient.id}/labTestResults`);
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
        `/v1/patient/${labTestsPatient.id}/labTestResults?status=${LAB_REQUEST_STATUSES.RECEPTION_PENDING}`,
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
      const response = await app.get(`/v1/patient/${labTestsPatient.id}/labTestResults`);
      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(labTestTypes.length);
      const uniqueCategories = [...new Set(response.body.data.map(x => x.testCategory))];
      expect(uniqueCategories.length).toBeGreaterThan(1);
    });

    it('Allows filtering lab tests by category', async () => {
      const response = await app.get(
        `/v1/patient/${labTestsPatient.id}/labTestResults?categoryId=${randomCategory.id}`,
      );
      expect(response).toHaveSucceeded();
      response.body.data.forEach(labTest => {
        expect(labTest.testCategory).toEqual(randomCategory.name);
      });
    });

    test.todo('Allows filtering lab tests by panel');
  });
});
