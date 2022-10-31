import * as reportsUtils from 'shared/reports';
import { fake } from 'shared/test-helpers';
import { createTestContext } from '../utilities';

describe('Reports', () => {
  let baseApp = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  describe('database defined reports', () => {
    let adminApp = null;
    let reportDefinition = null;
    let user = null;
    beforeAll(async () => {
      adminApp = await baseApp.asRole('admin');
      const { models } = ctx;
      user = await models.User.create({
        ...fake(models.User),
        email: 'test@tamanu.io',
      });
      await models.ReportDefinition.create({
        ...fake(models.ReportDefinition),
        name: 'test-report',
      });
      reportDefinition = await models.ReportDefinitionVersion.create({
        versionNumber: 1,
        status: 'published',
        userId: user.id,
        queryOptions: JSON.stringify({
          parameters: [{ parameterField: 'EmailField', name: 'email' }],
          defaultDateRange: 'allTime',
        }),
        query:
          'SELECT id, email from users WHERE CASE WHEN :email IS NOT NULL THEN email = :email ELSE TRUE END;',
      });
    });
    it('should run a simple database defined report', async () => {
      const response = await adminApp.post(`/v1/reports/${reportDefinition.id}`);
      expect(response).toHaveSucceeded();
      // There will be more than one user because of the app context
      expect(response.body.length).toBeGreaterThan(1);
    });
    it('should apply filters on a database defined report', async () => {
      const response = await adminApp.post(`/v1/reports/${reportDefinition.id}`).send({
        parameters: {
          email: user.email,
        },
      });
      expect(response).toHaveSucceeded();
      expect(response.body.length).toEqual(2);
      const headerRow = response.body[0];
      const firstRow = response.body[1];
      expect(headerRow[0]).toEqual('id');
      expect(headerRow[1]).toEqual('email');
      expect(firstRow[1]).toEqual(user.email);
    });
  });

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
      expect(res.body).toEqual({ error: { message: 'Report module not found' } });
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
