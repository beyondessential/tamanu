import { QueryTypes } from 'sequelize';
import { fake } from '@tamanu/shared/test-helpers';
import config from 'config';
import { createTestContext } from '../utilities';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';

describe('ReportSchemas', () => {
  let ctx;
  let adminApp;
  let user;
  let models;
  let raw;
  let reporting;

  beforeAll(async () => {
    ctx = await createTestContext({ mockReportingSchema: true });
    adminApp = await ctx.baseApp.asRole('admin');
    models = ctx.models;
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
    user = await models.User.create({
      ...fake(models.User),
      email: 'test@tamanu.io',
    });
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

  it('a report with db_schema=reporting can reference reporting schema tables without prefix', async () => {
    const reportDefinition = await ctx.models.ReportDefinition.create({
      name: 'test reporting definition',
      dbSchema: REPORT_DB_SCHEMAS.REPORTING,
    });
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: reportDefinition.id,
      query: 'SELECT * FROM reporting_test_table ORDER BY name;',
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      versionNumber: 1,
      userId: user.id,
    });
    const response = await adminApp.post(`/v1/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveSucceeded();
    expect(response.body).toEqual([
      ['id', 'name'],
      [1, 'A'],
      [2, 'B'],
    ]);
  });
});
