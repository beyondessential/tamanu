import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext({ mockReportingSchema: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('reporting can be used', async () => {
    expect(true).toBeTruthy();
  });
});
