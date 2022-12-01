import { createTestContext } from '../utilities';

describe('ReportRequest', () => {
  let baseApp = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  it('should reject reading a patient with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post('/v1/reportRequest/', {});
    expect(result).toBeForbidden();
  });

  describe('write', () => {
    let app = null;
    beforeAll(async () => {
      app = await baseApp.asRole('practitioner');
    });

    it('should fail with 400 and message if report module is not found', async () => {
      const res = await app.post('/v1/reportRequest').send({
        reportId: 'invalid-report',
        emailList: [],
      });
      expect(res).toHaveStatus(400);
      expect(res.body).toEqual({ error: { message: 'Report module not found' } });
    });

    it('should create a new report request', async () => {
      const result = await app.post('/v1/reportRequest').send({
        reportId: 'incomplete-referrals',
        emailList: ['example@gmail.com', 'other@gmail.com'],
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('id');

      expect(result.body).toHaveProperty('reportType', 'incomplete-referrals');
      expect(result.body).toHaveProperty(
        'recipients',
        JSON.stringify({ email: ['example@gmail.com', 'other@gmail.com'] }),
      );
      expect(result.body).toHaveProperty('requestedByUserId', app.user.dataValues.id);
    });
  });
});
