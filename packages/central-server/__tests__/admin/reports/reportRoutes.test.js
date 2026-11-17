import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { REPORT_DB_CONNECTIONS, REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import { initReporting } from '@tamanu/database/services/reporting';
import { createTestContext, withDateUnsafelyFaked } from '../../utilities';
import { readJSON, sanitizeFilename, verifyQuery } from '../../../app/admin/reports/utils';
import { User } from '@tamanu/database';
import path from 'path';
import { uploadDirPath } from '@tamanu/shared/utils/tmpdir';
import os from 'os';
import { promises as fs } from 'fs';

describe('reportRoutes', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;
  let testReport;
  let user;
  let dbSchema;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
    dbSchema = REPORT_DB_CONNECTIONS.RAW;
    testReport = await models.ReportDefinition.create({
      name: 'Test Report',
      dbSchema,
    });
    user = await User.create({
      displayName: 'Test User',
      email: 'db@dreportsuser.com',
    });
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    await models.ReportDefinitionVersion.destroy({
      where: {
        reportDefinitionId: testReport.id,
      },
    });
  });

  const getMockReportVersion = (versionNumber, query = 'select bark from dog') => ({
    versionNumber,
    query,
    reportDefinitionId: testReport.id,
    queryOptions: {
      defaultDateRange: '30days',
      parameters: [
        {
          parameterField: 'test-field',
          name: 'test-name',
        },
      ],
    },
    status: 'draft',
    notes: 'test',
    advancedConfig: null,
    userId: user.id,
  });

  describe('GET /reports', () => {
    it('should not return reports with no versions', async () => {
      const res = await adminApp.get('/api/admin/reports');
      expect(res).toHaveSucceeded();
      expect(res.body.find(r => r.id === testReport.id)).toBeUndefined();
    });
    it('should return a list of reports', async () => {
      await models.ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.get('/api/admin/reports');
      expect(res).toHaveSucceeded();
      const found = res.body.find(r => r.id === testReport.id);
      expect(found).toMatchObject({
        id: testReport.id,
        name: testReport.name,
      });
    });
    it('should return version count and last updated', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const latestVersion = await withDateUnsafelyFaked(new Date(Date.now() + 10000), () =>
        ReportDefinitionVersion.create(getMockReportVersion(2)),
      );
      const res = await adminApp.get('/api/admin/reports');
      expect(res).toHaveSucceeded();
      const found = res.body.find(r => r.id === testReport.id);
      expect(found.versionCount).toBe(2);
      expect(new Date(found.lastUpdated)).toEqual(latestVersion.updatedAt);
    });
  });

  describe('GET /reports/:id/versions', () => {
    it('should return a list of versions', async () => {
      const { ReportDefinitionVersion } = models;
      const v1 = await ReportDefinitionVersion.create(getMockReportVersion(1));
      const v2 = await ReportDefinitionVersion.create(getMockReportVersion(2));
      const res = await adminApp.get(`/api/admin/reports/${testReport.id}/versions`);
      expect(res).toHaveSucceeded();
      expect(res.body).toHaveLength(2);
      expect(res.body.map(x => x.id)).toEqual(expect.arrayContaining([v1.id, v2.id]));
    });
    it('shouldnt return unnecessary metadata', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.get(`/api/admin/reports/${testReport.id}/versions`);
      expect(res).toHaveSucceeded();
      const allowedKeys = [
        'id',
        'versionNumber',
        'query',
        'createdAt',
        'updatedAt',
        'status',
        'notes',
        'queryOptions',
        'active',
        'createdBy',
      ];
      const additionalKeys = Object.keys(res.body[0]).filter(k => !allowedKeys.includes(k));
      expect(additionalKeys).toHaveLength(0);
    });
  });

  describe('POST /reports', () => {
    it('should create a report', async () => {
      const name = 'Test Report 2';
      const { ReportDefinition, ReportDefinitionVersion } = models;
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...definition } = getMockReportVersion(
        1,
        'select * from patients limit 1',
      );
      const res = await adminApp.post('/api/admin/reports').send({ name, dbSchema, ...definition });
      expect(res).toHaveSucceeded();
      expect(res.body.query).toBe('select * from patients limit 1');
      expect(res.body.versionNumber).toBe(1);
      const reports = await ReportDefinition.findAll({
        where: {
          name,
        },
      });
      expect(reports).toHaveLength(1);
      const versions = await ReportDefinitionVersion.findAll({
        where: {
          reportDefinitionId: reports[0].id,
        },
      });
      expect(versions).toHaveLength(1);
    });

    it('should not return unnecessary metadata', async () => {
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...definition } = getMockReportVersion(
        1,
        'select * from patients limit 1',
      );
      const res = await adminApp
        .post('/api/admin/reports')
        .send({ name: 'Test Report 3', dbSchema, ...definition });
      expect(res).toHaveSucceeded();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'id',
          'name',
          'versionNumber',
          'query',
          'createdAt',
          'updatedAt',
          'status',
          'notes',
          'queryOptions',
        ]),
      );
    });

    it('should persist a non-null advancedConfig', async () => {
      const name = 'Test Report advancedConfig';
      const { ReportDefinition, ReportDefinitionVersion } = models;
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...definition } = getMockReportVersion(1, 'select 1');
      const res = await adminApp
        .post('/api/admin/reports')
        .send({ name, dbSchema, ...definition, advancedConfig: { dhis2DataSet: 'test-dataset-id' } });
      expect(res).toHaveSucceeded();
      const [report] = await ReportDefinition.findAll({ where: { name } });
      const versions = await ReportDefinitionVersion.findAll({
        where: { reportDefinitionId: report.id },
      });
      expect(versions).toHaveLength(1);
      expect(versions[0].advancedConfig).toEqual({ dhis2DataSet: 'test-dataset-id' });
    });
  });

  describe('POST /reports/:id/versions', () => {
    it('should create a new version', async () => {
      const { ReportDefinitionVersion } = models;
      const { versionNumber, ...newVersion } = getMockReportVersion(
        1,
        'select * from patients limit 1',
      );
      const res = await adminApp
        .post(`/api/admin/reports/${testReport.id}/versions`)
        .send(newVersion);
      expect(res).toHaveSucceeded();
      expect(res.body.query).toBe('select * from patients limit 1');
      expect(res.body.versionNumber).toBe(versionNumber);
      const versions = await ReportDefinitionVersion.findAll({
        where: {
          reportDefinitionId: testReport.id,
        },
      });
      expect(versions).toHaveLength(1);
    });

    it('should persist a non-null advancedConfig', async () => {
      const { ReportDefinitionVersion } = models;
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...newVersion } = getMockReportVersion(1, 'select 1');
      const res = await adminApp
        .post(`/api/admin/reports/${testReport.id}/versions`)
        .send({ ...newVersion, advancedConfig: { dhis2DataSet: 'test-dataset-id' } });
      expect(res).toHaveSucceeded();
      const versions = await ReportDefinitionVersion.findAll({
        where: { reportDefinitionId: testReport.id },
      });
      expect(versions).toHaveLength(1);
      expect(versions[0].advancedConfig).toEqual({ dhis2DataSet: 'test-dataset-id' });
    });

    it('should not return unnecessary metadata', async () => {
      const newVersion = getMockReportVersion(1, 'select * from patients limit 1');
      delete newVersion.versionNumber;

      const res = await adminApp
        .post(`/api/admin/reports/${testReport.id}/versions`)
        .send(newVersion);
      expect(res).toHaveSucceeded();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'id',
          'versionNumber',
          'query',
          'createdAt',
          'updatedAt',
          'status',
          'notes',
          'queryOptions',
        ]),
      );
    });

    it('should refuse a version for a report that does not exist', async () => {
      const newVersion = getMockReportVersion(1, 'select 1');
      delete newVersion.versionNumber;
      const res = await adminApp
        .post('/api/admin/reports/00000000-0000-0000-0000-000000000000/versions')
        .send(newVersion);
      expect(res.status).toBe(404);
    });
  });

  describe('raw schema permission', () => {
    let reportAuthorApp;
    beforeAll(async () => {
      reportAuthorApp = await baseApp.asNewRole([
        ['create', 'ReportDefinition'],
        ['create', 'ReportDefinitionVersion'],
      ]);
    });

    const getNewReport = name => {
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, reportDefinitionId, userId, ...definition } = getMockReportVersion(
        1,
        'select 1',
      );
      return { name, ...definition };
    };

    it('should refuse a raw report without permission to write the schema', async () => {
      const name = 'Raw report without schema permission';
      const res = await reportAuthorApp
        .post('/api/admin/reports')
        .send({ ...getNewReport(name), dbSchema: REPORT_DB_CONNECTIONS.RAW });
      expect(res).toHaveRequestError();
      expect(await models.ReportDefinition.count({ where: { name } })).toBe(0);
    });

    it('should create a reporting report without permission to write the schema', async () => {
      const res = await reportAuthorApp
        .post('/api/admin/reports')
        .send(getNewReport('Reporting report without schema permission'));
      expect(res).toHaveSucceeded();
    });

    it('should refuse a version of a raw report without permission to write the schema', async () => {
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...newVersion } = getMockReportVersion(1, 'select 1');
      const res = await reportAuthorApp
        .post(`/api/admin/reports/${testReport.id}/versions`)
        .send({ ...newVersion, dbSchema: REPORT_DB_CONNECTIONS.REPORTING });
      expect(res).toHaveRequestError();
      expect(
        await models.ReportDefinitionVersion.count({
          where: { reportDefinitionId: testReport.id },
        }),
      ).toBe(0);
    });
  });

  describe('GET /reports/:id/versions/:versionId/export/:format', () => {
    it('should export a report as json', async () => {
      const { ReportDefinitionVersion } = models;
      const versionData = getMockReportVersion(1);
      const v1 = await ReportDefinitionVersion.create(versionData);
      const res = await adminApp.get(
        `/api/admin/reports/${testReport.id}/versions/${v1.id}/export/json`,
      );
      expect(res).toHaveSucceeded();

      expect(res.body.filename).toBe('test-report-v1.json');
      expect(JSON.parse(Buffer.from(res.body.data).toString())).toEqual({
        ...versionData,
        id: v1.id,
        createdAt: v1.createdAt.toISOString(),
        dbSchema: 'raw',
        updatedAt: v1.updatedAt.toISOString(),
        deletedAt: null,
        advancedConfig: null,
      });
    });
    it('should export a report as sql', async () => {
      const { ReportDefinitionVersion } = models;
      const versionData = getMockReportVersion(1, 'select\n bark from dog');
      const v1 = await ReportDefinitionVersion.create(versionData);
      const res = await adminApp.get(
        `/api/admin/reports/${testReport.id}/versions/${v1.id}/export/sql`,
      );
      expect(res).toHaveSucceeded();
      expect(res.body.filename).toBe('test-report-v1.sql');
      expect(Buffer.from(res.body.data).toString()).toEqual(`select
 bark from dog`);
    });
  });

  describe('POST /reports/import', () => {
    const importReport = (file, jsonData) =>
      adminApp
        .post(`/api/admin/reports/import`)
        .attach('file', file)
        .field('jsonData', JSON.stringify(jsonData));

    it('should refuse a file path sent in a JSON body and leave the file in place', async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'report-import-'));
      const file = path.join(dir, 'report.json');
      await fs.copyFile(path.join(__dirname, '/data/without-version-number.json'), file);

      const res = await adminApp.post(`/api/admin/reports/import`).send({
        file,
        name: 'Report Import From Path',
        deleteFileAfterImport: true,
        dbSchema,
      });
      expect(res).toHaveRequestError();
      await expect(fs.access(file)).resolves.toBeUndefined();
      const report = await models.ReportDefinition.findOne({
        where: { name: 'Report Import From Path' },
      });
      expect(report).toBeFalsy();
      await fs.rm(dir, { recursive: true });
    });

    it('should not create a version if dry run', async () => {
      const res = await importReport(path.join(__dirname, '/data/without-version-number.json'), {
        name: 'Report Import Test Dry Run',
        dryRun: true,
        dbSchema,
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({
        versionNumber: 1,
        createdDefinition: true,
      });
      const report = await models.ReportDefinition.findOne({
        where: { name: 'Report Import Test Dry Run' },
        include: {
          model: models.ReportDefinitionVersion,
          as: 'versions',
        },
      });
      expect(report).toBeFalsy();
    });
    it('should import a version for new definition', async () => {
      const res = await importReport(path.join(__dirname, '/data/without-version-number.json'), {
        name: 'Report Import Test',
        dbSchema,
      });
      expect(res).toHaveSucceeded();
      const report = await models.ReportDefinition.findOne({
        where: { name: 'Report Import Test' },
        include: {
          model: models.ReportDefinitionVersion,
          as: 'versions',
        },
      });
      expect(res.body).toEqual({
        versionNumber: 1,
        createdDefinition: true,
        reportDefinitionId: report.id,
      });
      expect(report).toBeTruthy();
      expect(report.versions).toHaveLength(1);
      expect(report.versions[0].query).toBe('select * from patients limit 0');
    });
    it('should create a new latest version if existing definition and no version number', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await importReport(path.join(__dirname, '/data/without-version-number.json'), {
        name: testReport.name,
        dbSchema,
      });
      expect(res).toHaveSucceeded();
      const report = await models.ReportDefinition.findOne({
        where: { name: testReport.name },
        include: {
          model: models.ReportDefinitionVersion,
          as: 'versions',
        },
      });
      expect(res.body).toEqual({
        versionNumber: 2,
        reportDefinitionId: report.id,
        createdDefinition: false,
      });
      expect(report).toBeTruthy();
      expect(report.versions).toHaveLength(2);
    });
    it('should fail with InvalidOperationError if version number is specified', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await importReport(path.join(__dirname, '/data/with-version-number.json'), {
        name: testReport.name,
      });
      expect(res).toHaveRequestError('InvalidOperationError');
      expect(res.body.error.message).toBe('Cannot import a report with a version number');
    });

    it('should delete the uploaded file when the import fails', async () => {
      // the parser names what it writes with a random id and the original
      // extension, so a unique extension finds this upload and nothing else
      const res = await adminApp
        .post(`/api/admin/reports/import`)
        .attach('file', path.join(__dirname, '/data/with-version-number.json'), 'report.w15leak')
        .field('jsonData', JSON.stringify({ name: testReport.name, dbSchema }));

      expect(res).toHaveRequestError('InvalidOperationError');
      const leaked = (await fs.readdir(uploadDirPath())).filter(entry =>
        entry.endsWith('.w15leak'),
      );
      expect(leaked).toEqual([]);
    });
  });

  describe('utils', () => {
    describe('sanitizeFilename', () => {
      const tests = [
        [
          REPORT_VERSION_EXPORT_FORMATS.SQL,
          1,
          'test',
          `test-v1.${REPORT_VERSION_EXPORT_FORMATS.SQL}`,
        ],
        [
          REPORT_VERSION_EXPORT_FORMATS.JSON,
          10,
          'test-report',
          `test-report-v10.${REPORT_VERSION_EXPORT_FORMATS.JSON}`,
        ],
        [
          REPORT_VERSION_EXPORT_FORMATS.SQL,
          4,
          'test report',
          `test-report-v4.${REPORT_VERSION_EXPORT_FORMATS.SQL}`,
        ],
        [
          REPORT_VERSION_EXPORT_FORMATS.JSON,
          123,
          'test <report> ?weird filename',
          `test-report-weird-filename-v123.${REPORT_VERSION_EXPORT_FORMATS.JSON}`,
        ],
        [
          REPORT_VERSION_EXPORT_FORMATS.SQL,
          2,
          ' ../.test report',
          `test-report-v2.${REPORT_VERSION_EXPORT_FORMATS.SQL}`,
        ],
      ];
      it.each(tests)('should sanitize filename', (format, versionNum, filename, expected) => {
        expect(sanitizeFilename(filename, versionNum, format)).toBe(expected);
      });
    });
    describe('readJSON', () => {
      it('should return json from file', async () => {
        const json = await readJSON(path.join(__dirname, '/data/without-version-number.json'));
        expect(json).toEqual({
          query: 'select * from patients limit 0',
          queryOptions: {
            defaultDateRange: 'allTime',
            dataSources: ['thisFacility'],
            parameters: [
              {
                label: 'Area',
                name: 'locationGroup',
                parameterField: 'ParameterSuggesterSelectField',
                suggesterEndpoint: 'locationGroup',
              },
            ],
          },
          dbSchema: 'raw',
          status: 'published',
          notes: 'Report doing absolutely nothing',
        });
      });
      it('should throw error if file does not exist', async () => {
        await expect(readJSON(path.join(__dirname, '/data/non-existent.json'))).rejects.toThrow();
      });
      it('should throw error if file is not valid json', async () => {
        await expect(readJSON(path.join(__dirname, '/data/invalid.json'))).rejects.toThrow();
      });
    });
    describe('verifyQuery', () => {
      let reportSchemaStores;
      beforeAll(async () => {
        reportSchemaStores = await initReporting(ctx.store);
      });

      const verify = (query, { parameters = [], dbSchema = REPORT_DB_CONNECTIONS.RAW } = {}) =>
        verifyQuery(query, { parameters }, { reportSchemaStores }, dbSchema);

      it('verifies a valid read query', async () => {
        await expect(verify('select * from patients limit 1')).resolves.not.toThrow();
      });

      it('verifies a valid query with parameters', async () => {
        await expect(
          verify('select * from patients where id = :test limit 1', {
            parameters: [{ name: 'test' }],
          }),
        ).resolves.not.toThrow();
      });

      it('rejects an invalid query', async () => {
        await expect(verify('some random non sql query')).rejects.toThrow(/Invalid query/);
      });

      it.each([undefined, null, 'public', 'not-a-schema'])(
        'rejects a query with no configured reporting schema (%s)',
        async dbSchema => {
          await expect(
            verifyQuery(
              'select 1',
              { parameters: [] },
              { store: ctx.store, reportSchemaStores },
              dbSchema,
            ),
          ).rejects.toThrow(/unknown reporting schema/);
        },
      );

      it('rejects a query when the reporting schemas are unavailable', async () => {
        await expect(
          verifyQuery(
            'select 1',
            { parameters: [] },
            { store: ctx.store },
            REPORT_DB_CONNECTIONS.REPORTING,
          ),
        ).rejects.toThrow(/unknown reporting schema/);
      });

      describe('never executes the query', () => {
        const runOnMainStore = async sql => ctx.store.sequelize.query(sql);
        beforeAll(async () => {
          await runOnMainStore('CREATE TABLE IF NOT EXISTS verify_query_canary (id int)');
          await runOnMainStore('GRANT SELECT, INSERT ON verify_query_canary TO PUBLIC');
        });
        afterAll(async () => {
          await runOnMainStore('DROP TABLE IF EXISTS verify_query_canary');
        });
        const canaryRowCount = async () => {
          const [[{ count }]] = await ctx.store.sequelize.query(
            'SELECT count(*)::int AS count FROM verify_query_canary',
          );
          return count;
        };

        it('rejects a trailing statement', async () => {
          await expect(
            verify('select 1; insert into verify_query_canary values (1)'),
          ).rejects.toThrow(/Invalid query/);
          expect(await canaryRowCount()).toBe(0);
        });

        it('rejects ANALYZE smuggled into the EXPLAIN', async () => {
          await expect(
            verify('analyze insert into verify_query_canary values (1)'),
          ).rejects.toThrow(/Invalid query/);
          expect(await canaryRowCount()).toBe(0);
        });
      });
    });
  });
});
