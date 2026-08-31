import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { createTestContext } from '../utilities';

describe('PatientIssue', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  it('should record an issue', async () => {
    const result = await app.post('/api/patientIssue').send({
      patientId: patient.id,
      note: 'A patient issue',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should record an issue with a note longer than 255 characters', async () => {
    const note = 'a'.repeat(500);
    const result = await app.post('/api/patientIssue').send({
      patientId: patient.id,
      note,
    });
    expect(result).toHaveSucceeded();
    expect(result.body.note).toEqual(note);
  });

  it('should update an issue to a note longer than 255 characters', async () => {
    const { body: created } = await app.post('/api/patientIssue').send({
      patientId: patient.id,
      note: 'A patient issue',
    });

    const note = 'b'.repeat(500);
    const result = await app.put(`/api/patientIssue/${created.id}`).send({ note });
    expect(result).toHaveSucceeded();
    expect(result.body.note).toEqual(note);

    // reload to confirm postgres stored the note in full rather than truncating it
    const reloaded = await models.PatientIssue.findByPk(created.id);
    expect(reloaded.note).toEqual(note);
  });

  it('should require a valid patient', async () => {
    const result = await app.post('/api/patientIssue').send({
      patientId: 'not a patient',
      note: 'A patient issue',
    });
    expect(result).toHaveRequestError();
  });
});
