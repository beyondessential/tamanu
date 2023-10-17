import { QueryTypes } from 'sequelize';
import { fake } from '@tamanu/shared/test-helpers';
import config from 'config';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Tests are against mocked reporting schema and roles defined in
// packages/shared/src/demoData/createMockReportingSchemaAndRoles.js
// and role config defined in db.reports.credentials config/test.json
describe('ReportSchemaRoles', () => {
  let ctx;
  let adminApp;
  let user;
  let models;
  let raw;
  let reporting;
  let rawDefinition;
  let reportingDefinition;

  beforeAll(async () => {
    const { credentials } = config.db.reportSchemas;
    ctx = await createTestContext({ enableReportInstances: true });
    adminApp = await ctx.baseApp.asRole('admin');
    models = ctx.models;
    raw = ctx.reportSchemaStores.raw.sequelize;
    reporting = ctx.reportSchemaStores.reporting.sequelize;
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
      GRANT SELECT ON reporting.reporting_test_table TO ${credentials.reporting.username};
      GRANT SELECT ON raw_test_table TO ${credentials.raw.username};
      INSERT INTO reporting.reporting_test_table ("id", "name") VALUES ('1', 'A'), ('2', 'B');
      INSERT INTO raw_test_table ("id", "name") VALUES ('1', 'C'), ('2', 'D');
    `);
    user = await models.User.create({
      ...fake(models.User),
      email: 'test@tamanu.io',
    });

    rawDefinition = await models.ReportDefinition.create({
      name: 'test raw definition',
      dbSchema: REPORT_DB_SCHEMAS.RAW,
    });
    reportingDefinition = await models.ReportDefinition.create({
      name: 'test reporting definition',
      dbSchema: REPORT_DB_SCHEMAS.REPORTING,
    });
  });
  afterAll(async () => {
    await ctx.sequelize.query(`
      DROP TABLE reporting.reporting_test_table;
      DROP TABLE raw_test_table;
    `);
    await ctx.close();
  });

  beforeEach(async () => {
    await models.ReportDefinitionVersion.destroy({
      where: {
        reportDefinitionId: [rawDefinition.id, reportingDefinition.id],
      },
    });
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
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: reportingDefinition.id,
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
  it('a report with db_schema=raw can reference public schema tables', async () => {
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: rawDefinition.id,
      query: 'SELECT * FROM raw_test_table ORDER BY name;',
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      versionNumber: 1,
      userId: user.id,
    });
    const response = await adminApp.post(`/v1/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveSucceeded();
    expect(response.body).toEqual([
      ['id', 'name'],
      [1, 'C'],
      [2, 'D'],
    ]);
  });
  it('a report with db_schema=reporting cannot reference public schema tables', async () => {
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: reportingDefinition.id,
      query: 'SELECT * FROM public.raw_test_table ORDER BY name;',
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      versionNumber: 1,
      userId: user.id,
    });
    const response = await adminApp.post(`/v1/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveRequestError();
    expect(response.body.error.message).toEqual('permission denied for table raw_test_table');
  });
  it('a report should not be able to run non-select queries', async () => {
    await ctx.sequelize.query(`
      INSERT INTO reporting.reporting_test_table ("id", "name") VALUES ('3', 'C');
    `);
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: reportingDefinition.id,
      query: `DELETE FROM reporting_test_table where id = 3`,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      versionNumber: 1,
      userId: user.id,
    });
    const response = await adminApp.post(`/v1/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveRequestError();
    expect(response.body.error.message).toEqual('permission denied for table reporting_test_table');
  });
});
