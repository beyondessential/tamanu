import { REPORT_DB_CONNECTIONS, REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import { createTestContext, withDateUnsafelyFaked } from '../../utilities';
import { readJSON, sanitizeFilename, verifyQuery } from '../../../dist/admin/reports/utils';
import { User } from '@tamanu/database';
import path from 'path';

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
    userId: user.id,
  });

  describe('GET /reports', () => {
    it('should not return reports with no versions', async () => {
      const res = await adminApp.get('/api/admin/reports');
      expect(res).toHaveSucceeded();
      expect(res.body).toHaveLength(0);
    });
    it('should return a list of reports', async () => {
      await models.ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.get('/api/admin/reports');
      expect(res).toHaveSucceeded();
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
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
      expect(res.body[0].versionCount).toBe(2);
      expect(new Date(res.body[0].lastUpdated)).toEqual(latestVersion.updatedAt);
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
      expect(res.body.map((x) => x.id)).toEqual(expect.arrayContaining([v1.id, v2.id]));
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
      const additionalKeys = Object.keys(res.body[0]).filter((k) => !allowedKeys.includes(k));
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
    it('should not create a version if dry run', async () => {
      const res = await adminApp.post(`/api/admin/reports/import`).send({
        file: path.join(__dirname, '/data/without-version-number.json'),
        name: 'Report Import Test Dry Run',
        dryRun: true,
        deleteFileAfterImport: false,
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
      const res = await adminApp.post(`/api/admin/reports/import`).send({
        file: path.join(__dirname, '/data/without-version-number.json'),
        name: 'Report Import Test',
        deleteFileAfterImport: false,
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
      const res = await adminApp.post(`/api/admin/reports/import`).send({
        file: path.join(__dirname, '/data/without-version-number.json'),
        name: testReport.name,
        deleteFileAfterImport: false,
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
      const res = await adminApp.post(`/api/admin/reports/import`).send({
        file: path.join(__dirname, '/data/with-version-number.json'),
        name: testReport.name,
        deleteFileAfterImport: false,
      });
      expect(res).toHaveRequestError('InvalidOperationError');
      expect(res.body.error.message).toBe('Cannot import a report with a version number');
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
      it('should return true if query is valid', async () => {
        const query = 'select * from patients limit 1';
        await expect(
          verifyQuery(query, { parameters: [] }, { store: ctx.store }),
        ).resolves.not.toThrow();
      });
      it('should return true if query is valid with paramDefinition', async () => {
        const query = 'select * from patients where id = :test limit 1';
        await expect(
          verifyQuery(
            query,
            {
              parameters: [
                {
                  name: 'test',
                },
              ],
            },
            { store: ctx.store },
          ),
        ).resolves.not.toThrow();
      });
      it('should return false if query is invalid', async () => {
        const query = 'some random non sql query';
        await expect(verifyQuery(query, [], ctx.store)).rejects.toThrow();
      });
    });
  });
});
