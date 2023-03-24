import { User } from 'shared/models/User';
import { createTestContext } from '../utilities';
import { sanitizeFilename, stripMetadata } from '../../app/admin/reports/utils';
import { REPORT_ADMIN_EXPORT_FORMATS } from '../../../shared-src/src/constants/reports';

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

  const getMockReportVersion = versionNumber => ({
    versionNumber,
    reportDefinitionId: testReport.id,
    query: 'select bark from dog',
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
      await ReportDefinitionVersion.create(getMockReportVersion(2));
      const res = await adminApp.get('/v1/admin/reports');
      expect(res).toHaveSucceeded();
      expect(res.body[0].versionCount).toBe(2);
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
    describe('sanitizeFilename', () => {
      const tests = [
        [REPORT_ADMIN_EXPORT_FORMATS.SQL, 1, 'test', `test-v1.${REPORT_ADMIN_EXPORT_FORMATS.SQL}`],
        [
          REPORT_ADMIN_EXPORT_FORMATS.JSON,
          10,
          'test-report',
          `test-report-v10.${REPORT_ADMIN_EXPORT_FORMATS.JSON}`,
        ],
        [
          REPORT_ADMIN_EXPORT_FORMATS.SQL,
          4,
          'test report',
          `test-report-v4.${REPORT_ADMIN_EXPORT_FORMATS.SQL}`,
        ],
        [
          REPORT_ADMIN_EXPORT_FORMATS.JSON,
          123,
          'test <report> ?weird filename',
          `test-report-weird-filename-v123.${REPORT_ADMIN_EXPORT_FORMATS.JSON}`,
        ],
      ];
      it.each(tests)('should sanitize filename', (format, versionNum, filename, expected) => {
        expect(sanitizeFilename(filename, versionNum, format)).toBe(expected);
      });
    });
  });
});
