import {
  createDummyPatient,
  randomReferenceId,
  randomUser,
} from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Ongoing conditions', () => {
  let patient = null;
  let app = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });

  it('should record an ongoing condition', async () => {
    const result = await app.post('/v1/ongoingCondition').send({
      diagnosisId: randomReferenceId(models, 'icd10'),
      patientId: patient.id,
      practitionerId: await randomUser(models),
      relationship: "mother",
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should require a valid diagnosis', async () => {
    const result = await app.post('/v1/ongoingCondition').send({
      diagnosisId: 'invalid id',
      patientId: patient.id,
      practitionerId: await randomUser(models),
      relationship: "mother",
    });
    expect(result).toHaveRequestError();
  });
});
