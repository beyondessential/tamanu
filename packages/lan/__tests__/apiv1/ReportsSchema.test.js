import { QueryTypes } from 'sequelize';
import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();

    await ctx.sequelize.query(`
    CREATE TABLE IF NOT EXISTS reporting.test_table (
       "id" integer NOT NULL,
       "data" text,
       PRIMARY KEY ("id")
    );
    INSERT INTO reporting.test_table (id, data) VALUES (1, 'red'), (2, 'blue'), (3, 'green');
  `);
  });
  afterAll(() => ctx.close());

  it('reporting can be used', async () => {
    const res = await ctx.reports.reporting.query(
      `
      SELECT * FROM reporting.test_table order by id;
    `,
      { type: QueryTypes.SELECT },
    );
    expect(res).toEqual([
      {
        id: 1,
        data: 'red',
      },
      {
        id: 2,
        data: 'blue',
      },
      {
        id: 3,
        data: 'green',
      },
    ]);
  });
});
