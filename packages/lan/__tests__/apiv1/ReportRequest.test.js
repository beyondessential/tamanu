import { createTestContext } from '../utilities';
import { testReportPermissions } from './reportsApiCommon';

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
    const result = await noPermsApp.post('/v1/reportRequest/').send({
      reportId: 'incomplete-referrals',
    });
    expect(result).toBeForbidden();
  });

  describe('permissions', () => {
    testReportPermissions(
      () => ctx,
      (reportApp, reportId) => reportApp.post('/v1/reportRequest').send({ reportId }),
    );
  });

  describe('write', () => {
    let app = null;
    beforeAll(async () => {
      app = await baseApp.asRole('practitioner');
    });

    it('should fail with 404 and message if report module is not found', async () => {
      const res = await app.post('/v1/reportRequest').send({
        reportId: 'invalid-report',
        emailList: [],
      });
      expect(res).toHaveStatus(404);
      expect(res.body).toMatchObject({ error: { message: 'Report module not found' } });
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
