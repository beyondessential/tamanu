import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { PATIENT_FIELD_DEFINITION_TYPES } from 'shared/constants/patientFields';
import { createTestContext } from '../utilities';

describe('Patient', () => {
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
    it('should get a tree of field categories, definitions, and values', async () => {
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
      });

      const patient = await Patient.create(await createDummyPatient(models));
      await PatientFieldValue.create({
        value: 'Oldest',
        definitionId: definition1.id,
        patientId: patient.id,
      });
      await PatientFieldValue.create({
        value: 'Newest',
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
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0]).toMatchObject({
        definitionId: definition1.id,
        name: 'Test Field 1',
        category: 'Test Category 1',
        value: 'Newest',
      });
    });
  });
});
