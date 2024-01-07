import { subDays, startOfDay } from 'date-fns';
import config from 'config';

import {
  createDummyEncounter,
  createDummyEncounterMedication,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/shared/demoData/patients';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';

import { fake } from '@tamanu/shared/test-helpers/fake';
import { randomLabRequest } from '@tamanu/shared/demoData/labRequests';
import { LAB_REQUEST_STATUSES, REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { getCurrentDateString, toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';

import { createTestContext } from '../utilities';

describe('Patient', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let patient = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    await models.Facility.upsert({
      id: config.serverFacilityId,
      name: config.serverFacilityId,
      code: config.serverFacilityId,
    });
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should reject reading a patient with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.get(`/v1/patient/${patient.id}`);
    expect(result).toBeForbidden();
  });

  test.todo('should create an access record');

  test.todo('should get a list of patients matching a filter');
  test.todo('should reject listing of patients with insufficient permissions');

  it('should get the details of a patient', async () => {
    const result = await app.get(`/v1/patient/${patient.id}`);
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('displayId', patient.displayId);
    expect(result.body).toHaveProperty('firstName', patient.firstName);
    expect(result.body).toHaveProperty('lastName', patient.lastName);
  });

  test.todo('should get a list of patient conditions');
  test.todo('should get a list of patient allergies');
  test.todo('should get a list of patient family history entries');
  test.todo('should get a list of patient issues');

  it('should get empty results when checking for last discharged encounter medications', async () => {
    // Create encounter without endDate (not discharged yet)
    await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });

    // Expect result data to be empty since there are no discharged encounters or medications
    const result = await app.get(`/v1/patient/${patient.id}/lastDischargedEncounter/medications`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 0,
      data: [],
    });
  });

  it('should get the last discharged encounter and include discharged medications', async () => {
    // Create three encounters: First two will be discharged, the last one won't
    const encounterOne = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
    const encounterTwo = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
    await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });

    // Create two medications for encounterTwo (the one we should get)
    const dischargedMedication = await models.EncounterMedication.create({
      ...(await createDummyEncounterMedication(models, { isDischarge: true })),
      encounterId: encounterTwo.id,
    });
    await models.EncounterMedication.create({
      ...(await createDummyEncounterMedication(models)),
      encounterId: encounterTwo.id,
    });

    // Edit the first two encounters to simulate a discharge
    // (the second one needs to have a 'greater' date to be the last)
    const endDate = new Date();
    await Promise.all([
      encounterOne.update({ endDate }),
      encounterTwo.update({ endDate: new Date(endDate.getTime() + 1000) }),
    ]);

    // Expect encounter to be the second encounter discharged
    // and include discharged medication with reference associations
    const result = await app.get(`/v1/patient/${patient.id}/lastDischargedEncounter/medications`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 1,
      data: expect.any(Array),
    });
    expect(result.body.data[0]).toMatchObject({
      id: dischargedMedication.id,
      medication: expect.any(Object),
      encounter: {
        location: expect.any(Object),
      },
    });
  });

  describe('write', () => {
    it('should reject users with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');

      const result = await noPermsApp.put(`/v1/patient/${patient.id}`).send({
        firstName: 'New',
      });

      expect(result).toBeForbidden();
    });

    it('should create a new patient', async () => {
      const newPatient = await createDummyPatient(models);
      const result = await app.post('/v1/patient').send(newPatient);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('displayId', newPatient.displayId);
      expect(result.body).toHaveProperty('firstName', newPatient.firstName);
      expect(result.body).toHaveProperty('lastName', newPatient.lastName);
    });

    it('should create a new patient with additional data', async () => {
      const newPatient = await createDummyPatient(models);
      const result = await app.post('/v1/patient').send({
        ...newPatient,
        passport: 'TEST-PASSPORT',
      });

      expect(result).toHaveSucceeded();

      const { id } = result.body;
      const additional = await models.PatientAdditionalData.findOne({ where: { patientId: id } });
      expect(additional).toBeTruthy();
      expect(additional).toHaveProperty('passport', 'TEST-PASSPORT');
    });

    it('should create a new patient with fields', async () => {
      // Arrange
      const { PatientFieldDefinitionCategory, PatientFieldDefinition, PatientFieldValue } = models;
      const category = await PatientFieldDefinitionCategory.create({
        name: 'Test Category',
      });
      const definition = await PatientFieldDefinition.create({
        name: 'Test Field',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        categoryId: category.id,
      });
      const newPatient = await createDummyPatient(models);

      // Act
      const result = await app.post('/v1/patient').send({
        ...newPatient,
        patientFields: {
          [definition.id]: 'Test Field Value',
        },
      });

      // Assert
      expect(result).toHaveSucceeded();
      const values = await PatientFieldValue.findAll({
        where: { patientId: result.body.id },
      });
      expect(values).toEqual([
        expect.objectContaining({
          value: 'Test Field Value',
        }),
      ]);
    });

    it('should update patient details', async () => {
      // skip middleName, to be added in PUT request
      const newPatient = await createDummyPatient(models, { middleName: '' });
      const result = await app.post('/v1/patient').send(newPatient);
      expect(result.body.middleName).toEqual('');

      const newVillage = await randomReferenceId(models, 'village');
      const updateResult = await app.put(`/v1/patient/${result.body.id}`).send({
        villageId: newVillage,
        middleName: 'MiddleName',
        bloodType: 'AB+',
      });

      expect(updateResult).toHaveSucceeded();
      expect(updateResult.body).toHaveProperty('villageId', newVillage);
      expect(updateResult.body).toHaveProperty('middleName', 'MiddleName');

      const additionalDataResult = await app.get(`/v1/patient/${result.body.id}/additionalData`);

      expect(additionalDataResult).toHaveSucceeded();
      expect(additionalDataResult.body).toHaveProperty('bloodType', 'AB+');
    });

    it('should update patient fields', async () => {
      // Arrange
      const { PatientFieldDefinitionCategory, PatientFieldDefinition, PatientFieldValue } = models;
      const category = await PatientFieldDefinitionCategory.create({
        name: 'Test Category',
      });
      const definition = await PatientFieldDefinition.create({
        name: 'Test Field',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
        categoryId: category.id,
      });
      const newPatient = await createDummyPatient(models);
      const {
        body: { id: patientId },
      } = await app.post('/v1/patient').send({
        ...newPatient,
        patientFields: {
          [definition.id]: 'Test Field Value',
        },
      });

      // Act
      const result = await app.put(`/v1/patient/${patientId}`).send({
        patientFields: {
          [definition.id]: 'Test Field Value 2',
        },
      });

      // Assert
      expect(result).toHaveSucceeded();
      const values = await PatientFieldValue.findAll({
        where: { patientId },
      });
      expect(values).toEqual([
        expect.objectContaining({
          value: 'Test Field Value 2',
        }),
      ]);
    });

    test.todo('should create a new patient as a new birth');

    test.todo('should add a new condition');
    test.todo('should edit an existing condition');
    test.todo('should add a new allergy');
    test.todo('should edit an existing allergy');
    test.todo('should add a new family history entry');
    test.todo('should edit an existing family history entry');
    test.todo('should add a new issue');
    test.todo('should edit an existing issue');
  });

  describe('merge', () => {
    test.todo('should merge two patients into a single record');
  });

  test.todo('should get a list of patient encounters');
  test.todo('should get a list of patient appointments');
  test.todo('should get a list of patient referrals');

  describe('Update display ID (editPatientDisplayId feature flag)', () => {
    beforeAll(async () => {
      // Create expected reference data
      await Promise.all([
        models.ReferenceData.create({
          id: 'secondaryIdType-tamanu-display-id',
          code: 'tamanu-display-id',
          name: 'Tamanu Display ID',
          type: 'secondaryIdType',
        }),
        models.ReferenceData.create({
          id: 'secondaryIdType-nhn',
          code: 'nhn',
          name: 'National Health Number',
          type: 'secondaryIdType',
        }),
      ]);
    });

    it('Should create a secondary ID record when changing display ID', async () => {
      const oldDisplayId = 'ABCD123456';
      const newPatient = await models.Patient.create({
        ...fake(models.Patient),
        displayId: oldDisplayId,
      });

      const newDisplayId = '123456789';
      const updateResult = await app.put(`/v1/patient/${newPatient.id}`).send({
        displayId: newDisplayId,
      });
      expect(updateResult).toHaveSucceeded();
      expect(updateResult.body.displayId).toEqual(newDisplayId);

      const secondaryId = await models.PatientSecondaryId.findOne({
        where: { value: oldDisplayId },
      });
      expect(secondaryId).toBeTruthy();
    });

    it('Should use the proper secondary ID type', async () => {
      const oldDisplayId = '0fe8e054-2149-4442-9423-9dcaf7b67c20';
      const newPatient = await models.Patient.create({
        ...fake(models.Patient),
        displayId: oldDisplayId,
      });

      const newDisplayId = '555666777';
      const updateResult = await app.put(`/v1/patient/${newPatient.id}`).send({
        displayId: newDisplayId,
      });
      expect(updateResult).toHaveSucceeded();
      expect(updateResult.body.displayId).toEqual(newDisplayId);

      const secondaryId = await models.PatientSecondaryId.findOne({
        where: { value: oldDisplayId },
      });
      expect(secondaryId.typeId).toBe('secondaryIdType-nhn');
    });
  });

  describe('Get patient covid clearance lab tests', () => {
    let user;
    let lab;
    let category;
    let labTestType1;
    let labTestType2;
    let method;

    beforeAll(async () => {
      user = await models.User.create({
        displayName: 'Test User',
        email: 'testuser@test.test',
      });
      lab = await models.ReferenceData.create({
        type: REFERENCE_TYPES.LAB_TEST_LABORATORY,
        name: 'Test Laboratory',
        code: 'TESTLABORATORY',
      });

      category = await models.ReferenceData.create({
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
        name: 'Test Category',
        code: 'testLabTestCategory',
      });

      labTestType1 = await models.LabTestType.create({
        labTestCategoryId: category.id,
        name: 'Test Test Type 1',
        code: 'TESTTESTTYPE1',
      });

      labTestType2 = await models.LabTestType.create({
        labTestCategoryId: category.id,
        name: 'Test Test Type2',
        code: 'TESTTESTTYPE2',
      });

      method = await models.ReferenceData.create({
        type: REFERENCE_TYPES.LAB_TEST_METHOD,
        name: 'Test Method',
        code: 'testLabTestMethod',
      });
    });

    it('includes lab requests after {daysSinceSampleTime} days', async () => {
      await models.Setting.set(
        'certifications.covidClearanceCertificate',
        {
          labTestResults: ['Positive'],
          daysSinceSampleTime: 10,
        },
        SETTINGS_SCOPES.GLOBAL,
      );

      const patient1 = await models.Patient.create(await createDummyPatient(models));

      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });

      const labRequest = await models.LabRequest.create({
        ...(await randomLabRequest(models)),
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        requestedById: user.id,
        labTestLaboratoryId: lab.id,
        sampleTime: toDateTimeString(subDays(startOfDay(new Date()), 11)), // 1 day AFTER daysSinceSampleTime
      });

      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType1.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });

      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType2.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });

      const result = await app.get(
        `/v1/patient/${patient1.id}/covidLabTests?certType=${CertificateTypes.clearance}`,
      );

      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toEqual(2);
    });

    it('excludes lab requests before {daysSinceSampleTime} days', async () => {
      await models.Setting.set(
        'certifications.covidClearanceCertificate',
        {
          labTestResults: ['Positive'],
          daysSinceSampleTime: 10,
        },
        SETTINGS_SCOPES.GLOBAL,
      );

      const patient2 = await models.Patient.create(await createDummyPatient(models));

      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient2.id,
      });
      const labRequest = await models.LabRequest.create({
        ...(await randomLabRequest(models)),
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        requestedById: user.id,
        labTestLaboratoryId: lab.id,
        sampleTime: toDateTimeString(subDays(startOfDay(new Date()), 9)), // 1 day BEFORE daysSinceSampleTime
      });

      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType1.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });

      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType2.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });

      const result = await app.get(
        `/v1/patient/${patient2.id}/covidLabTests?certType=${CertificateTypes.clearance}`,
      );

      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toEqual(0);
    });

    it('includes lab requests that is in configured "labTestResults"', async () => {
      await models.Setting.set(
        'certifications.covidClearanceCertificate',
        {
          labTestResults: ['Positive'],
          daysSinceSampleTime: 10,
        },
        SETTINGS_SCOPES.GLOBAL,
      );

      const patient1 = await models.Patient.create(await createDummyPatient(models));

      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient1.id,
      });

      const labRequest = await models.LabRequest.create({
        ...(await randomLabRequest(models)),
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        requestedById: user.id,
        labTestLaboratoryId: lab.id,
        sampleTime: toDateTimeString(subDays(startOfDay(new Date()), 11)), // 1 day AFTER daysSinceSampleTime
      });

      await models.LabTest.create({
        result: 'Positive',
        labTestTypeId: labTestType1.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });

      await models.LabTest.create({
        result: 'Negative',
        labTestTypeId: labTestType2.id,
        labRequestId: labRequest.id,
        labTestMethodId: method.id,
        completedDate: getCurrentDateString(),
      });

      const result = await app.get(
        `/v1/patient/${patient1.id}/covidLabTests?certType=${CertificateTypes.clearance}`,
      );

      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toEqual(1);
      expect(result.body.data[0].result).toEqual('Positive');
    });
  });
});
