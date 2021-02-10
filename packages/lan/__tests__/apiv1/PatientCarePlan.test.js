import {
  createDummyPatient,
  createDummyEncounter,
  randomUser,
  randomReferenceId,
} from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('PatientCarePlan', () => {
  let app = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
  });

  beforeEach(async () => {
    await models.Note.destroy({ where: {}, truncate: true });
    await models.PatientCarePlan.destroy({ where: {}, truncate: true });
  });

  it('should reject creating an admissions report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/patientCarePlan`, {});
    expect(result).toBeForbidden();
  });

  describe('create a care plan for a patient', () => {
    let patient = null;
    let diseaseId = null;
    beforeAll(async () => {
      patient = await models.Patient.create(await createDummyPatient(models));
      diseaseId = await randomReferenceId(models, 'icd10');
    });

    it('should create a care plan with note', async () => {
      const result = await app.post('/v1/patientCarePlan').send({
        recordedDate: new Date().toISOString(),
        diseaseId,
        patientId: patient.get('id'),
        note: 'Main care plan',
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('id');
      expect(result.body.patientId).toBe(patient.get('id'));
      expect(result.body.diseaseId).toBe(diseaseId);
      const noteResult = await app.get(`/v1/patientCarePlan/${result.body.id}/notes`);
      expect(noteResult).toHaveSucceeded();
      expect(noteResult.body.length).toBeGreaterThan(0);
      expect(noteResult.body[0].content).toBe('Main care plan');
    });
  });
});
