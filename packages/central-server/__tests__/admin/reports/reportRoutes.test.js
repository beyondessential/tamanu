import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';
import supertest from 'supertest';
import { REPORT_DB_CONNECTIONS, REPORT_VERSION_EXPORT_FORMATS } from '@tamanu/constants/reports';
import { JWT_TOKEN_TYPES, SERVER_TYPES } from '@tamanu/constants';
import { initReporting } from '@tamanu/database/services/reporting';
import { createTestContext, withDateUnsafelyFaked } from '../../utilities';
import { readJSON, sanitizeFilename, verifyQuery } from '../../../app/admin/reports/utils';
import { createApi } from '../../../app/createApi';
import { buildToken } from '../../../app/auth/utils';
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

    it('should refuse a report whose query does not plan, and save nothing', async () => {
      const name = 'Report with an unplannable query';
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...definition } = getMockReportVersion(
        1,
        'some random non sql query',
      );
      const res = await adminApp.post('/api/admin/reports').send({ name, dbSchema, ...definition });
      expect(res).toHaveRequestError();
      expect(res.body.error.message).toMatch(/Invalid query/);
      expect(await models.ReportDefinition.count({ where: { name } })).toBe(0);
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

  it('POST /reports should refuse a report with an unknown reporting schema', async () => {
    const name = 'Report with an unknown schema';
    // eslint-disable-next-line no-unused-vars
    const { versionNumber, ...definition } = getMockReportVersion(1, 'select 1');
    const res = await adminApp
      .post('/api/admin/reports')
      .send({ ...definition, name, dbSchema: 'not-a-schema' });
    expect(res).toHaveRequestError();
    expect(res.body.error.message).toMatch(/Unknown reporting schema/);
    expect(await models.ReportDefinition.count({ where: { name } })).toBe(0);
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

    it("should check a version against its report's schema, not the one in the request", async () => {
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...newVersion } = getMockReportVersion(1, 'select 1');
      const res = await adminApp
        .post(`/api/admin/reports/${testReport.id}/versions`)
        .send({ ...newVersion, dbSchema: 'not-a-schema' });
      expect(res).toHaveSucceeded();
    });

    it('should refuse a version whose query does not plan, and save nothing', async () => {
      // eslint-disable-next-line no-unused-vars
      const { versionNumber, ...newVersion } = getMockReportVersion(1, 'some random non sql query');
      const res = await adminApp
        .post(`/api/admin/reports/${testReport.id}/versions`)
        .send(newVersion);
      expect(res).toHaveRequestError();
      expect(res.body.error.message).toMatch(/Invalid query/);
      expect(
        await models.ReportDefinitionVersion.count({
          where: { reportDefinitionId: testReport.id },
        }),
      ).toBe(0);
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

    it('should refuse importing a raw report without permission to write the schema', async () => {
      const name = 'Raw report imported without schema permission';
      const res = await reportAuthorApp
        .post(`/api/admin/reports/import`)
        .attach('file', path.join(__dirname, '/data/without-version-number.json'))
        .field('jsonData', JSON.stringify({ name }));
      expect(res).toHaveRequestError();
      expect(res.body.error.message).toMatch(/permission to use the raw reporting schema/);
      expect(await models.ReportDefinition.count({ where: { name } })).toBe(0);
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

  describe('PATCH /reports/:id', () => {
    const createReport = (name, schema = dbSchema) =>
      models.ReportDefinition.create({ name, dbSchema: schema });

    it('renames a report without creating a version', async () => {
      const report = await createReport('Rename Me');
      await models.ReportDefinitionVersion.create({
        ...getMockReportVersion(1),
        reportDefinitionId: report.id,
      });

      const res = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: '  Renamed Report  ' });

      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ id: report.id, name: 'Renamed Report' });
      await report.reload();
      expect(report.name).toBe('Renamed Report');
      const versionCount = await models.ReportDefinitionVersion.count({
        where: { reportDefinitionId: report.id },
      });
      expect(versionCount).toBe(1);
    });

    it('accepts the report keeping its own name', async () => {
      const report = await createReport('Unchanged Name');
      const res = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Unchanged Name' });
      expect(res).toHaveSucceeded();
      expect(res.body.name).toBe('Unchanged Name');
    });

    it('rejects a blank name', async () => {
      const report = await createReport('Blank Rename');
      const res = await adminApp.patch(`/api/admin/reports/${report.id}`).send({ name: '   ' });
      expect(res).toHaveRequestError();
      await report.reload();
      expect(report.name).toBe('Blank Rename');
    });

    it('rejects a name another report uses', async () => {
      const report = await createReport('Duplicate Source');
      await createReport('Duplicate Target');
      const res = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Duplicate Target' });
      expect(res).toHaveRequestError(422);
      expect(res.body.error.name).toBe('InvalidOperationError');
      expect(res.body.error.message).toBe('Report name already exists');
    });

    it('rejects a name a deleted report still uses', async () => {
      const report = await createReport('Deleted Source');
      const deletedReport = await createReport('Deleted Target');
      await deletedReport.destroy();
      const res = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Deleted Target' });
      expect(res).toHaveRequestError(422);
      expect(res.body.error.name).toBe('InvalidOperationError');
      expect(res.body.error.message).toBe('A deleted report is still using this name');
    });

    it('returns not found for an unknown report', async () => {
      const res = await adminApp
        .patch('/api/admin/reports/no-such-report')
        .send({ name: 'Anything' });
      expect(res.status).toBe(404);
    });

    it('forbids a user without permission to write reports', async () => {
      const report = await createReport('Forbidden Rename');
      const baseUserApp = await baseApp.asRole('base');
      const res = await baseUserApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Should Not Apply' });
      expect(res).toBeForbidden();
      await report.reload();
      expect(report.name).toBe('Forbidden Rename');
    });

    it('forbids a user whose write permission is for a different report', async () => {
      const report = await createReport('Scoped Elsewhere Target', REPORT_DB_CONNECTIONS.REPORTING);
      const grantedReport = await createReport(
        'Scoped Elsewhere Grant',
        REPORT_DB_CONNECTIONS.REPORTING,
      );
      const scopedApp = await baseApp.asNewRole([['write', 'ReportDefinition', grantedReport.id]]);
      const res = await scopedApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Scoped Elsewhere Renamed' });
      expect(res).toBeForbidden();
      await report.reload();
      expect(report.name).toBe('Scoped Elsewhere Target');
    });

    it('allows a user whose write permission is for the report being renamed', async () => {
      const report = await createReport('Scoped Own Target', REPORT_DB_CONNECTIONS.REPORTING);
      const scopedApp = await baseApp.asNewRole([['write', 'ReportDefinition', report.id]]);
      const res = await scopedApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Scoped Own Renamed' });
      expect(res).toHaveSucceeded();
      await report.reload();
      expect(report.name).toBe('Scoped Own Renamed');
    });

    it('refuses a raw schema report to a user who cannot edit the raw schema', async () => {
      const report = await createReport('Raw Gate Target', REPORT_DB_CONNECTIONS.RAW);
      const writerApp = await baseApp.asNewRole([['write', 'ReportDefinition']]);
      const res = await writerApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Raw Gate Renamed' });
      expect(res).toHaveRequestError(422);
      expect(res.body.error.message).toBe(
        'You do not have permission to rename reports using the raw schema',
      );
      await report.reload();
      expect(report.name).toBe('Raw Gate Target');
    });

    it('allows a reporting schema report for a user who cannot edit the raw schema', async () => {
      const report = await createReport('Raw Gate Reporting', REPORT_DB_CONNECTIONS.REPORTING);
      const writerApp = await baseApp.asNewRole([['write', 'ReportDefinition']]);
      const res = await writerApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Raw Gate Reporting Renamed' });
      expect(res).toHaveSucceeded();
      await report.reload();
      expect(report.name).toBe('Raw Gate Reporting Renamed');
    });

    describe('when the reporting schemas failed to initialise', () => {
      // The raw schema gate is an authorisation rule, so it must hold in the degraded
      // mode the server runs in when initReporting fails at startup.
      let degradedExpressApp;

      const asDegradedUser = async user => {
        const agent = supertest.agent(degradedExpressApp);
        agent.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);
        const token = await buildToken({ userId: user.id }, null, {
          expiresIn: '1d',
          audience: JWT_TOKEN_TYPES.ACCESS,
          issuer: config.canonicalHostName,
        });
        agent.set('authorization', `Bearer ${token}`);
        return agent;
      };

      beforeAll(async () => {
        const degradedCtx = Object.create(ctx);
        degradedCtx.reportSchemaStores = null;
        ({ express: degradedExpressApp } = await createApi(degradedCtx));
      });

      it('still refuses a raw schema report to a user who cannot edit the raw schema', async () => {
        const report = await createReport('Degraded Raw Gate Target', REPORT_DB_CONNECTIONS.RAW);
        const writerApp = await baseApp.asNewRole([['write', 'ReportDefinition']]);
        const degradedApp = await asDegradedUser(writerApp.user);
        const res = await degradedApp
          .patch(`/api/admin/reports/${report.id}`)
          .send({ name: 'Degraded Raw Gate Renamed' });
        expect(res).toHaveRequestError(422);
        expect(res.body.error.message).toBe(
          'You do not have permission to rename reports using the raw schema',
        );
        await report.reload();
        expect(report.name).toBe('Degraded Raw Gate Target');
      });

      it('still renames a reporting schema report', async () => {
        const report = await createReport(
          'Degraded Reporting Target',
          REPORT_DB_CONNECTIONS.REPORTING,
        );
        const degradedApp = await asDegradedUser(adminApp.user);
        const res = await degradedApp
          .patch(`/api/admin/reports/${report.id}`)
          .send({ name: 'Degraded Reporting Renamed' });
        expect(res).toHaveSucceeded();
        await report.reload();
        expect(report.name).toBe('Degraded Reporting Renamed');
      });
    });

    it('rejects a name of only zero width characters', async () => {
      const report = await createReport('Zero Width Rename');
      const res = await adminApp.patch(`/api/admin/reports/${report.id}`).send({ name: '​​' });
      expect(res).toHaveRequestError(422);
      expect(res.body.error.message).toContain('Report name is required');
      await report.reload();
      expect(report.name).toBe('Zero Width Rename');
    });

    it('rejects a name holding a control character', async () => {
      const report = await createReport('Control Character Rename');
      const nulRes = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Control\u0000Character' });
      expect(nulRes).toHaveRequestError(422);
      expect(nulRes.body.error.message).toContain(
        'Report name must not contain control or formatting characters',
      );

      const newlineRes = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'Control\nCharacter' });
      expect(newlineRes).toHaveRequestError(422);

      await report.reload();
      expect(report.name).toBe('Control Character Rename');
    });

    it('accepts a name of 255 characters and rejects one of 256', async () => {
      const report = await createReport('Length Boundary Rename');
      const longestName = 'a'.repeat(255);
      const acceptedRes = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: longestName });
      expect(acceptedRes).toHaveSucceeded();
      expect(acceptedRes.body.name).toBe(longestName);

      const rejectedRes = await adminApp
        .patch(`/api/admin/reports/${report.id}`)
        .send({ name: 'b'.repeat(256) });
      expect(rejectedRes).toHaveRequestError(422);
      expect(rejectedRes.body.error.message).toContain(
        'Report name must be no longer than 255 characters',
      );
      await report.reload();
      expect(report.name).toBe(longestName);
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

    it('should import a report whose file names no schema', async () => {
      const name = 'Report Import No Schema';
      const res = await importReport(path.join(__dirname, '/data/no-schema.json'), { name });
      expect(res).toHaveSucceeded();
      const report = await models.ReportDefinition.findOne({ where: { name } });
      expect(report.dbSchema).toBe(REPORT_DB_CONNECTIONS.REPORTING);
    });

    it('should refuse a report on an unknown reporting schema', async () => {
      const name = 'Report Import Unknown Schema';
      const res = await importReport(path.join(__dirname, '/data/unknown-schema.json'), { name });
      expect(res).toHaveRequestError();
      expect(res.body.error.message).toMatch(/Unknown reporting schema/);
      expect(await models.ReportDefinition.count({ where: { name } })).toBe(0);
    });

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
        verifyQuery({ query, parameters, dbSchema, reportSchemaStores });

      it('verifies a valid read query and returns its plan', async () => {
        await expect(verify('select * from patients limit 1')).resolves.toEqual(
          expect.arrayContaining([expect.stringContaining('patients')]),
        );
      });

      it('verifies a valid query with parameters', async () => {
        await expect(
          verify('select * from patients where id = :test limit 1', {
            parameters: [{ name: 'test' }],
          }),
        ).resolves.not.toThrow();
      });

      it('rejects a second statement even when it is harmless', async () => {
        // Pins the single-statement rule on its own: the read-only transaction would let this through.
        await expect(verify('select 1; select 2')).rejects.toThrow(/multiple commands/);
      });

      it('rejects an invalid query', async () => {
        await expect(verify('some random non sql query')).rejects.toThrow(/Invalid query/);
      });

      it.each([undefined, null, 'public', 'not-a-schema'])(
        'rejects a query with no configured reporting schema (%s)',
        async dbSchema => {
          await expect(
            verifyQuery({ query: 'select 1', dbSchema, reportSchemaStores }),
          ).rejects.toThrow(/Unknown reporting schema/);
        },
      );

      it.each([
        [
          'a server shutdown',
          Object.assign(new Error('terminating connection'), { severity: 'FATAL', code: '57P01' }),
        ],
        [
          'an unreachable server',
          Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
        ],
        [
          'a reporting role with the wrong password',
          Object.assign(new Error('password authentication failed'), {
            severity: 'FATAL',
            code: '28P01',
          }),
        ],
        [
          'a reporting connection naming a database that does not exist',
          Object.assign(new Error('database "nope" does not exist'), {
            severity: 'FATAL',
            code: '3D000',
          }),
        ],
      ])('passes through %s rather than blaming the query', async (_, connectionError) => {
        const unreachableStores = {
          [REPORT_DB_CONNECTIONS.RAW]: {
            sequelize: {
              dialect: ctx.store.sequelize.dialect,
              transaction: async () => {
                throw connectionError;
              },
            },
          },
        };
        const error = await verifyQuery({
          query: 'select 1',
          dbSchema: REPORT_DB_CONNECTIONS.RAW,
          reportSchemaStores: unreachableStores,
        }).catch(err => err);
        expect(error).toBe(connectionError);
      });

      it('rejects a query when the reporting schemas are unavailable', async () => {
        await expect(
          verifyQuery({ query: 'select 1', dbSchema: REPORT_DB_CONNECTIONS.REPORTING }),
        ).rejects.toThrow(/Unknown reporting schema/);
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
