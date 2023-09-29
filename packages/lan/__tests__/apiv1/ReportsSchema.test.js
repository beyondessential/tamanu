import { QueryTypes } from 'sequelize';
import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext({ mockReportingSchema: true });
  });
  afterAll(async () => {
    await ctx.sequelize.query(`
      DROP TABLE reporting.test_table;
    `);
    await ctx.close();
  });

  it('reporting can be used', async () => {
    const res = await ctx.reports.reporting.query(
      `
      SELECT * FROM reporting.test_table order by id;
    `,
      { type: QueryTypes.SELECT },
    );
    expect(res).toEqual([]);
  });
});
