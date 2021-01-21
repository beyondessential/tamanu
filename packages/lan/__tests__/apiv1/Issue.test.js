import {
  createDummyPatient,
} from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Issue', () => {
  let patient = null;
  let app = null;

  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(await createDummyPatient(models));
  });

  it('should record an issue', async () => {
    const result = await app.post('/v1/issue').send({
      patientId: patient.id,
      note: 'A patient issue',
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

  it('should require a valid patient', async () => {
    const result = await app.post('/v1/issue').send({
      patientId: 'not a patient',
      note: 'A patient issue',
    });
    expect(result).toHaveRequestError();
  });
});
