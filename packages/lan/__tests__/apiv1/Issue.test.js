import {
  createDummyPatient,
  randomReferenceId,
  randomUser,
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

  // it('should record an allergy', async () => {
  //   const result = await app.post('/v1/allergy').send({
  //     allergyId: randomReferenceId(models, 'allergy'),
  //     patientId: patient.id,
  //     practitionerId: await randomUser(models),
  //   });
  //   expect(result).toHaveSucceeded();
  //   expect(result.body.recordedDate).toBeTruthy();
  // });

  // it('should require a valid allergy', async () => {
  //   const result = await app.post('/v1/allergy').send({
  //     allergyId: 'invalid id',
  //     patientId: patient.id,
  //     practitionerId: await randomUser(models),
  //   });
  //   expect(result).toHaveRequestError();
  // });
});
