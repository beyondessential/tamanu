import { QueryTypes } from 'sequelize';
import { fake } from '@tamanu/fake-data/fake';
import { REPORT_DB_CONNECTIONS, REPORT_DB_CONNECTION_ROLES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Each reporting connection logs in as its own unprivileged, read-only role,
// provisioned by initReporting().
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
      GRANT SELECT ON reporting.reporting_test_table TO ${REPORT_DB_CONNECTION_ROLES.reporting};
      GRANT SELECT ON raw_test_table TO ${REPORT_DB_CONNECTION_ROLES.raw};
      INSERT INTO reporting.reporting_test_table ("id", "name") VALUES ('1', 'A'), ('2', 'B');
      INSERT INTO raw_test_table ("id", "name") VALUES ('1', 'C'), ('2', 'D');
    `);
    user = await models.User.create({
      ...fake(models.User),
      email: 'test@tamanu.io',
    });

    rawDefinition = await models.ReportDefinition.create({
      name: 'test raw definition',
      dbSchema: REPORT_DB_CONNECTIONS.RAW,
    });
    reportingDefinition = await models.ReportDefinition.create({
      name: 'test reporting definition',
      dbSchema: REPORT_DB_CONNECTIONS.REPORTING,
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
  describe('a public schema table', () => {
    it('can be accessed by raw user', async () => {
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
  });
  describe('a reporting schema table', () => {
    it('can be accessed by reporting user', async () => {
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
  });
  describe('a report with db_schema=reporting', () => {
    it('can reference reporting schema tables without prefix', async () => {
      const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
        reportDefinitionId: reportingDefinition.id,
        query: 'SELECT * FROM reporting_test_table ORDER BY name;',
        queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
        versionNumber: 1,
        userId: user.id,
      });
      const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual([
        ['id', 'name'],
        [1, 'A'],
        [2, 'B'],
      ]);
    });

    it('cannot reference public schema tables', async () => {
      const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
        reportDefinitionId: reportingDefinition.id,
        query: 'SELECT * FROM public.raw_test_table ORDER BY name;',
        queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
        versionNumber: 1,
        userId: user.id,
      });
      const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
      expect(response).toHaveRequestError();
      expect(response.body.error.message).toEqual('permission denied for table raw_test_table');
    });
  });

  describe('a report with db_schema=raw', () => {
    it('can reference public schema tables', async () => {
      const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
        reportDefinitionId: rawDefinition.id,
        query: 'SELECT * FROM raw_test_table ORDER BY name;',
        queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
        versionNumber: 1,
        userId: user.id,
      });
      const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual([
        ['id', 'name'],
        [1, 'C'],
        [2, 'D'],
      ]);
    });

    it('can reference reporting schema tables', async () => {
      const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
        reportDefinitionId: reportingDefinition.id,
        query: 'SELECT * FROM reporting.reporting_test_table ORDER BY name;',
        queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
        versionNumber: 1,
        userId: user.id,
      });
      const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
      expect(response).toHaveSucceeded();
      expect(response.body).toEqual([
        ['id', 'name'],
        [1, 'A'],
        [2, 'B'],
      ]);
    });
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
    const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveRequestError();
    expect(response.body.error.message).toEqual('permission denied for table reporting_test_table');
  });

  it('cannot escape the sandbox by ending the transaction and switching roles', async () => {
    // COMMIT + RESET ROLE can't escalate: the session is the unprivileged role itself.
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: reportingDefinition.id,
      query: `COMMIT; RESET ROLE; INSERT INTO reporting.reporting_test_table ("id", "name") VALUES (99, 'escaped');`,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      versionNumber: 1,
      userId: user.id,
    });
    const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveRequestError();
    const [{ count }] = await ctx.sequelize.query(
      `SELECT count(*)::int AS count FROM reporting.reporting_test_table WHERE id = '99'`,
      { type: QueryTypes.SELECT },
    );
    expect(count).toBe(0);
  });

  it('cannot escape the sandbox via the raw connection (public schema) either', async () => {
    const reportDefinitionVersion = await ctx.models.ReportDefinitionVersion.create({
      reportDefinitionId: rawDefinition.id,
      query: `COMMIT; RESET ROLE; INSERT INTO raw_test_table ("id", "name") VALUES (99, 'escaped');`,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      versionNumber: 1,
      userId: user.id,
    });
    const response = await adminApp.post(`/api/reports/${reportDefinitionVersion.id}`);
    expect(response).toHaveRequestError();
    const [{ count }] = await ctx.sequelize.query(
      `SELECT count(*)::int AS count FROM raw_test_table WHERE id = 99`,
      { type: QueryTypes.SELECT },
    );
    expect(count).toBe(0);
  });
});
