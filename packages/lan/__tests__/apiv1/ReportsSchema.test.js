import { QueryTypes } from 'sequelize';
import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext({ mockReportingSchema: true });
    console.log(ctx);
  });
  afterAll(async () => {
    // await ctx.close();
  });

  it('reporting can be used', async () => {
    expect(true).toEqual([]);
  });
});
