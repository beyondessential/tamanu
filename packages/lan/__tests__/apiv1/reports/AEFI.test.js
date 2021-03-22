import { createTestContext } from '../../utilities';

describe('AEFI report', () => {
  let baseApp = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });

  it('should reject creating an aefi report with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const result = await noPermsApp.post(`/v1/reports/aefi`, {});
    expect(result).toBeForbidden();
  });
});
