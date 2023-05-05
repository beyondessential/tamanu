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
      // TODO: fake allergy?
      // TODO: weird that this validates honestly
    });
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();

    // TODO check persisted audit log entries
  });

  it('should leave an access record with permission details', async () => {
    const result = await baseApp.post('/v1/allergy').send({});
    expect(result).toBeForbidden();

    // TODO check persisted audit log entries
  });

  it('should not resolve an audit log entry twice', async () => {
    // TODO test for this but it's definitely happening currently
  });

  it('should discard an audit log when appropriate', async () => {
    // TODO
  });
});
