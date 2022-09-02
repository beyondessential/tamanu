import * as reportsUtils from 'shared/reports';
import { createTestContext } from '../utilities';

describe('Reports', () => {
  let baseApp = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  describe('post', () => {
    let app = null;
    beforeAll(async () => {
      app = await baseApp.asRole('practitioner');
    });
    it('should reject reading a report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post('/v1/reports/incomplete-referrals', {});
      expect(result).toBeForbidden();
    });
    it('should fail with 400 and message if report module is not found', async () => {
      jest.spyOn(reportsUtils, 'getReportModule').mockResolvedValue(null);
      const res = await app.post('/v1/reports/invalid-report', {});
      expect(res).toHaveStatus(400);
      expect(res.body).toEqual({ error: { message: 'invalid reportId' } });
    });
    it('should fail with 400 and error message if dataGenerator encounters error', async () => {
      jest.spyOn(reportsUtils, 'getReportModule').mockResolvedValue({
        dataGenerator: jest.fn().mockRejectedValue(new Error('test-error-message')),
        permission: 'Patient', // just need any valid permission
      });
      const res = await app.post('/v1/reports/incomplete-referrals', {});
      expect(res).toHaveStatus(400);
      expect(res.body).toEqual({ error: { message: 'test-error-message' } });
    });
  });
});
