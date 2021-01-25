import { createDummyPatient, randomReferenceId } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Patient', () => {
  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
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
});
