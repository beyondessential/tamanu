import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('ReportRequest', () => {
  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
  });

  it('should reject reading a patient with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post('/v1/reportRequest/', {});
    expect(result).toBeForbidden();
  });

  describe('write', () => {
    xit('should create a new report request', async () => {
      const result = await app.post('/v1/reportRequest').send({
        reportType: 'incomplete-referrals',
        emailList: ['example@gmail.com', 'other@gmail.com'],
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('id');
      expect(result.body).toHaveProperty('reportType', 'incomplete-referrals');
      expect(result.body).toHaveProperty('recipients', 'example@gmail.com,other@gmail.com');
      expect(result.body).toHaveProperty('requestedByUserId');
    });
  });
});
