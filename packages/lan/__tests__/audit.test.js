import { createTestContext } from './utilities';

describe('Audit log', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  it('should leave an access record', async () => {
    const result = await app.post('/v1/allergy').send({
//      allergyId: await randomReferenceId(models, 'allergy'),
//      patientId: patient.id,
//      practitionerId: await randomUser(models),
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();
  });

});
