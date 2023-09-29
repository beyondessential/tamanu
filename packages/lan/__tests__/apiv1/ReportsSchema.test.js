import config from 'config';
import { QueryTypes } from 'sequelize';
import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();

    const { reporting, raw } = config.db.reporting.credentials;
    // Create the reporting schema and test table and reporting users for test setup
    await ctx.sequelize.query(`
    CREATE SCHEMA IF NOT EXISTS reporting
    CREATE TABLE IF NOT EXISTS reporting.test_table (
       "id" integer NOT NULL,
       "data" text,
       PRIMARY KEY ("id")
    );
    INSERT INTO reporting.test_table (id, data) VALUES (1, 'red'), (2, 'blue'), (3, 'green');
    CREATE ROLE ${reporting.username} with password ${reporting.password};
    ALTER ROLE ${reporting.username} SET search_path TO reporting;
    GRANT USAGE ON SCHEMA reporting TO ${reporting.username};
    GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO ${reporting.username};

    CREATE ROLE ${raw.username} with password ${raw.password};
    GRANT USAGE ON SCHEMA public TO ${raw.username};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${raw.username};
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
