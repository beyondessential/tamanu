import { User } from 'shared/models/User';
import { stripMetadata, verifyQuery } from '../../app/admin/reports/utils';
import { createTestContext, withDate } from '../utilities';

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

  const getMockReportVersion = (versionNumber, query = 'select * from encounters limit 0') => ({
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
        query: 'select * from patients limit 1',
      });
      expect(res).toHaveSucceeded();
      expect(res.body.query).toBe('select * from patients limit 1');
    });
    it('should not return unnecessary metadata', async () => {
      const { ReportDefinitionVersion } = models;
      const v1 = await ReportDefinitionVersion.create(getMockReportVersion(1));
      const res = await adminApp.put(`/v1/admin/reports/${testReport.id}/versions/${v1.id}`).send({
        query: 'select * from patients limit 1',
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
      const newVersion = getMockReportVersion(1, 'select * from patients limit 1');
      const res = await adminApp
        .post(`/v1/admin/reports/${testReport.id}/versions`)
        .send(newVersion);
      expect(res).toHaveSucceeded();
      expect(res.body.query).toBe('select * from patients limit 1');
      expect(res.body.versionNumber).toBe(1);
      const versions = await ReportDefinitionVersion.findAll({
        where: {
          reportDefinitionId: testReport.id,
        },
      });
      expect(versions).toHaveLength(1);
    });

    it('should not return unnecessary metadata', async () => {
      const newVersion = getMockReportVersion(1, 'select * from patients limit 1');
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

  describe('utils', () => {
    describe('stripMetadata', () => {
      it('should strip metadata', async () => {
        const { ReportDefinitionVersion } = models;
        const mockVersion = await ReportDefinitionVersion.create(getMockReportVersion(1));
        const {
          updatedAtSyncTick,
          reportDefinitionId,
          ReportDefinitionId,
          deletedAt,
          userId,
          ...mockVersionWithoutMetadata
        } = mockVersion.get({ plain: true });
        expect(stripMetadata(mockVersion)).toEqual(mockVersionWithoutMetadata);
      });
      it('should strip metadata except relationIds if specified', async () => {
        const { ReportDefinitionVersion } = models;
        const mockVersion = await ReportDefinitionVersion.create(getMockReportVersion(1));
        const {
          updatedAtSyncTick,
          ReportDefinitionId,
          deletedAt,
          ...mockVersionWithoutMetadata
        } = mockVersion.get({ plain: true });
        expect(stripMetadata(mockVersion, true)).toEqual(mockVersionWithoutMetadata);
      });
    });
    describe('verifyQuery', () => {
      it('should return true if query is valid', async () => {
        const query = 'select * from patients limit 1';
        expect(verifyQuery({ query }, ctx.store)).resolves.not.toThrow();
      });
      it('should return false if query is invalid', async () => {
        const query = 'some random non sql query';
        expect(verifyQuery({ query }, ctx.store)).rejects.toThrow();
      });
    });
  });
});
