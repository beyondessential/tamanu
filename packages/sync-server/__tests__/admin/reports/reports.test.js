import { User } from 'shared/models/User';
import path from 'path';
import { createTestContext, withDate } from '../../utilities';
import { readJSON, verifyQuery } from '../../../app/admin/reports/utils';

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

  describe('POST /reports/import', () => {
    it('should import a version for new definition', async () => {
      const res = await adminApp.post(`/v1/admin/reports/import`).send({
        file: path.join(__dirname, '/data/without-version-number.json'),
        name: 'Report Import Test',
        userId: user.id,
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({
        versionNumber: 1,
        method: 'create',
        createdDefinition: true,
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
      const version = await ReportDefinitionVersion.create(
        getMockReportVersion(1, 'select * from encounters limit 0'),
      );
      const res = await adminApp.post(`/v1/admin/reports/import`).send({
        file: path.join(__dirname, '/data/with-version-number.json'),
        name: testReport.name,
        userId: user.id,
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({
        versionNumber: 1,
        method: 'update',
        createdDefinition: false,
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
    it('should create a new latest version if existing definition and no version number', async () => {
      const { ReportDefinitionVersion } = models;
      await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.post(`/v1/admin/reports/import`).send({
        file: path.join(__dirname, '/data/without-version-number.json'),
        name: testReport.name,
        userId: user.id,
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({
        versionNumber: 2,
        method: 'create',
        createdDefinition: false,
      });
      const report = await models.ReportDefinition.findOne({
        where: { name: testReport.name },
        include: {
          model: models.ReportDefinitionVersion,
          as: 'versions',
        },
      });
      expect(report).toBeTruthy();
      expect(report.versions).toHaveLength(2);
    });
    it('should fail if version does not exist on existing definition', async () => {
      const res = await adminApp.post(`/v1/admin/reports/import`).send({
        file: path.join(__dirname, '/data/with-version-number.json'),
        name: testReport.name,
        userId: user.id,
      });
      expect(res).toHaveRequestError();
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Version 1 does not exist for report Test Report');
    });
  });
  describe('utils', () => {
    describe('verifyQuery', () => {
      it('should return true if query is valid', async () => {
        const query = 'select * from patients limit 1';
        expect(verifyQuery(query, [], ctx.store)).resolves.not.toThrow();
      });
      it('should return false if query is invalid', async () => {
        const query = 'some random non sql query';
        expect(verifyQuery(query, [], ctx.store)).rejects.toThrow();
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
          status: 'published',
          notes: 'Report doing absolutely nothing',
        });
      });
      it('should throw error if file does not exist', async () => {
        expect(readJSON(path.join(__dirname, '/data/non-existent.json'))).rejects.toThrow();
      });
      it('should throw error if file is not valid json', async () => {
        expect(readJSON(path.join(__dirname, '/data/invalid.json'))).rejects.toThrow();
      });
    });
  });
});
