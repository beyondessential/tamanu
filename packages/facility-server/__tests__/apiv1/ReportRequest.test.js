import { createTestContext } from '../utilities';
import { testReportPermissions } from './reportsApiCommon';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';

describe('ReportRequest', () => {
  let baseApp = null;
  let ctx;
  let reportVersionId;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    const { ReportDefinitionVersion } = ctx.store.models;
    const version = await ReportDefinitionVersion.findOne({
      where: { reportDefinitionId: GENERIC_SURVEY_EXPORT_REPORT_ID },
    });
    reportVersionId = version.id;
  });
  afterAll(() => ctx.close());

  it('should reject reading a patient with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post('/api/reportRequest/').send({
      reportId: reportVersionId,
    });
    expect(result).toBeForbidden();
  });

  describe('permissions', () => {
    testReportPermissions(
      () => ctx,
      (reportApp, reportId, data = {}) => reportApp.post('/api/reportRequest').send({ reportId, ...data }),
    );
  });

  describe('write', () => {
    let app = null;
    beforeAll(async () => {
      app = await baseApp.asRole('practitioner');
    });

    it('should fail with 404 and message if report module is not found', async () => {
      const res = await app.post('/api/reportRequest').send({
        reportId: 'invalid-report',
        emailList: [],
      });
      expect(res).toHaveStatus(404);
      expect(res.body).toMatchObject({ error: { message: 'Report module not found' } });
    });

    it('should create a new report request', async () => {
      const result = await app.post('/api/reportRequest').send({
        reportId: reportVersionId,
        emailList: ['example@gmail.com', 'other@gmail.com'],
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('id');

      expect(result.body).toHaveProperty('reportDefinitionVersionId', reportVersionId);
      expect(result.body).toHaveProperty(
        'recipients',
        JSON.stringify({ email: ['example@gmail.com', 'other@gmail.com'] }),
      );
      expect(result.body).toHaveProperty('requestedByUserId', app.user.dataValues.id);
    });
  });
});
