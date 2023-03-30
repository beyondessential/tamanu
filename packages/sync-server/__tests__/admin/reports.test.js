import { User } from 'shared/models/User';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext, withDate } from '../utilities';
import path from 'path';

describe('reports', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;
  let testReport;
  let user;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
    testReport = await models.ReportDefinition.create({
      name: 'Test Report',
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
    it('should return a list of reports', async () => {
      const res = await adminApp.get('/v1/admin/reports');
      expect(res).toHaveSucceeded();
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(testReport.id);
    });
    it('should return version count and last updated', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const latestVersion = await withDate(new Date(Date.now() + 10000), () =>
        ReportDefinitionVersion.create(getMockReportVersion(2)),
      );
      const res = await adminApp.get('/v1/admin/reports');
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
      const res = await adminApp.get(`/v1/admin/reports/${testReport.id}/versions`);
      expect(res).toHaveSucceeded();
      expect(res.body).toHaveLength(2);
      expect(res.body.map(x => x.id)).toEqual(expect.arrayContaining([v1.id, v2.id]));
    });
    it('shouldnt return unnecessary metadata', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.get(`/v1/admin/reports/${testReport.id}/versions`);
      expect(res).toHaveSucceeded();
      expect(Object.keys(res.body[0])).toEqual(
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

  describe('PUT /reports/:id/versions/:versionId', () => {
    it('should update a version', async () => {
      const { ReportDefinitionVersion } = models;
      const v1 = await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.put(`/v1/admin/reports/${testReport.id}/versions/${v1.id}`).send({
        query: 'select meow from cat',
      });
      expect(res).toHaveSucceeded();
      expect(res.body.query).toBe('select meow from cat');
    });
    it('should not return unnecessary metadata', async () => {
      const { ReportDefinitionVersion } = models;
      const v1 = await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.put(`/v1/admin/reports/${testReport.id}/versions/${v1.id}`, {
        query: 'select meow from cat',
      });
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

  describe('POST /reports/:id/versions', () => {
    it('should create a new version', async () => {
      const { ReportDefinitionVersion } = models;
      const newVersion = getMockReportVersion(1, 'select meow from cat');
      const res = await adminApp
        .post(`/v1/admin/reports/${testReport.id}/versions`)
        .send(newVersion);
      expect(res).toHaveSucceeded();
      expect(res.body.query).toBe('select meow from cat');
      expect(res.body.versionNumber).toBe(1);
      const versions = await ReportDefinitionVersion.findAll({
        where: {
          reportDefinitionId: testReport.id,
        },
      });
      expect(versions).toHaveLength(1);
    });

    it('should not return unnecessary metadata', async () => {
      const newVersion = getMockReportVersion(1, 'select meow from cat');
      const res = await adminApp
        .post(`/v1/admin/reports/${testReport.id}/versions`)
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
  describe('POST /reports/import', () => {
    it('should import a report', async () => {
      const res = await adminApp
        .post(`/v1/admin/reports/import`)
        .send({
          file: path.join(__dirname, '/data/without-version-number.json'),
          name: 'Report Import Test',
        });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({
        createdDefinition: true,
        versionNumber: 1,
        usedFallbackUser: true,
        versionMethod: 'create',
      });
      const report = await models.ReportDefinition.findOne({
        where: { name: 'Report Import Test' },
        include: {
          model: models.ReportDefinitionVersion,
          as: 'versions',
        },
      });
      expect(report).toBeTruthy();
      expect(report.versions).toHaveLength(1);
      expect(report.versions[0].query).toBe('select * from patients limit 0');
    });
    it('should override an existing version', async () => {
      const { ReportDefinitionVersion } = models;
      const version = await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp
        .post(`/v1/admin/reports/import`)
        .send({
          file: path.join(__dirname, '/data/existing-version-number.json'),
          name: testReport.name,
        });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({
        createdDefinition: false,
        versionNumber: 1,
        usedFallbackUser: true,
        versionMethod: 'update',
      });
      const report = await models.ReportDefinition.findOne({
        where: { name: testReport.name },
        include: {
          model: models.ReportDefinitionVersion,
          as: 'versions',
        },
      });
      expect(report).toBeTruthy();
      expect(report.versions).toHaveLength(1);
      expect(report.versions[0].query).toBe('select * from patients limit 0');
      expect(report.versions[0].id).toBe(version.id);
    });
  });
  describe('GET /reports/:id/versions/:versionId/export/:format', () => {
    it('should export a report as json', async () => {
      const { ReportDefinitionVersion } = models;
      const versionData = getMockReportVersion(1);
      const v1 = await ReportDefinitionVersion.create(versionData);
      const res = await adminApp.get(
        `/v1/admin/reports/${testReport.id}/versions/${v1.id}/export/json`,
      );
      expect(res).toHaveSucceeded();

      expect(res.body.filename).toBe('test-report-v1.json');
      expect(JSON.parse(Buffer.from(res.body.data).toString())).toEqual({
        ...versionData,
        id: v1.id,
        createdAt: v1.createdAt.toISOString(),
        updatedAt: v1.updatedAt.toISOString(),
      });
    });
    it('should export a report as sql', async () => {
      const { ReportDefinitionVersion } = models;
      const versionData = getMockReportVersion(1, 'select \n bark from dog');
      const v1 = await ReportDefinitionVersion.create(versionData);
      const res = await adminApp.get(
        `/v1/admin/reports/${testReport.id}/versions/${v1.id}/export/sql`,
      );
      expect(res).toHaveSucceeded();
      expect(res.body.filename).toBe('test-report-v1.sql');
      expect(Buffer.from(res.body.data).toString()).toEqual(`select 
 bark from dog`);
    });
  });
});
