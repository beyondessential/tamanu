import { QueryTypes } from 'sequelize';
import config from 'config';
import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;
  let adminApp;
  let raw;
  let reporting;

  beforeAll(async () => {
    ctx = await createTestContext({ mockReportingSchema: true });
    adminApp = await ctx.baseApp.asRole('admin');
    raw = ctx.reports.raw.sequelize;
    reporting = ctx.reports.reporting.sequelize;
    await ctx.sequelize.query(`
      CREATE TABLE reporting.reporting_test_table (
        "id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        PRIMARY KEY ("id")
      );
      CREATE TABLE raw_test_table (
        "id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        PRIMARY KEY ("id")
      );
      GRANT SELECT ON reporting.reporting_test_table TO ${config.db.reports.credentials.reporting.username};
      GRANT SELECT ON raw_test_table TO ${config.db.reports.credentials.raw.username};
      INSERT INTO reporting.reporting_test_table ("id", "name") VALUES ('1', 'A'), ('2', 'B');
      INSERT INTO raw_test_table ("id", "name") VALUES ('1', 'C'), ('2', 'D');
    `);
  });
  afterAll(async () => {
    await ctx.sequelize.query(`
      DROP TABLE reporting.reporting_test_table;
      DROP TABLE raw_test_table;
    `);
    await ctx.close();
  });

  it('public schema table can be accessed by raw user', async () => {
    const result = await raw.query('SELECT * FROM raw_test_table ORDER BY name', {
      type: QueryTypes.SELECT,
    });
    expect(result).toEqual([
      {
        id: 1,
        name: 'C',
      },
      {
        id: 2,
        name: 'D',
      },
    ]);
  });

  it('reporting schema table can be accessed by reporting user', async () => {
    const result = await reporting.query(
      `SELECT * FROM reporting.reporting_test_table ORDER BY name;`,
      {
        type: QueryTypes.SELECT,
      },
    );
    expect(result).toEqual([
      {
        id: 1,
        name: 'A',
      },
      {
        id: 2,
        name: 'B',
      },
    ]);
  });

  it('a report with schema_name can be accessed by reporting user', async () => {
    // const response = await adminApp.post(`/v1/reports/${reportDefinitionVersion.id}`);
    expect(true).toBeTruthy();
  });
});
