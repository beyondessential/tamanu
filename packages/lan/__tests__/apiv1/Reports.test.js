import { fake } from 'shared/test-helpers';
import { REPORT_STATUSES, REPORT_DEFAULT_DATE_RANGES } from 'shared/constants';
import { setHardcodedPermissionsUseForTestsOnly, unsetUseHardcodedPermissionsUseForTestsOnly } from 'shared/permissions/rolesToPermissions';
import { createTestContext } from '../utilities';

const reportsUtils = {
  __esModule: true,
  ...jest.requireActual('shared/reports'),
};

describe('Reports', () => {
  let baseApp = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  describe('database defined reports', () => {
    let adminApp = null;
    let reportDefinition = null;
    let user = null;
    beforeAll(async () => {
      adminApp = await baseApp.asRole('admin');
      const { models } = ctx;
      user = await models.User.create({
        ...fake(models.User),
        email: 'test@tamanu.io',
      });
      await models.ReportDefinition.create({
        ...fake(models.ReportDefinition),
        name: 'test-report',
      });
      reportDefinition = await models.ReportDefinitionVersion.create({
        versionNumber: 1,
        status: 'published',
        userId: user.id,
        queryOptions: JSON.stringify({
          parameters: [{ parameterField: 'EmailField', name: 'email' }],
          defaultDateRange: 'allTime',
        }),
        query:
          'SELECT id, email from users WHERE CASE WHEN :email IS NOT NULL THEN email = :email ELSE TRUE END;',
      });
    });
    it('should run a simple database defined report', async () => {
      const response = await adminApp.post(`/v1/reports/${reportDefinition.id}`);
      expect(response).toHaveSucceeded();
      // There will be more than one user because of the app context
      expect(response.body.length).toBeGreaterThan(1);
    });
    it('should apply filters on a database defined report', async () => {
      const response = await adminApp.post(`/v1/reports/${reportDefinition.id}`).send({
        parameters: {
          email: user.email,
        },
      });
      expect(response).toHaveSucceeded();
      expect(response.body.length).toEqual(2);
      const headerRow = response.body[0];
      const firstRow = response.body[1];
      expect(headerRow[0]).toEqual('id');
      expect(headerRow[1]).toEqual('email');
      expect(firstRow[1]).toEqual(user.email);
    });
  });

  describe('permissions', () => {
    let app;
    let user;
    let permittedReports;
    let restrictedReports;
    let role;

    beforeAll(async () => {
      // Arrange
      setHardcodedPermissionsUseForTestsOnly(false);
      const { models } = ctx;
      const { Role, Permission, ReportDefinition, ReportDefinitionVersion } = models;
      role = await Role.create(fake(Role));
      app = await baseApp.asRole(role.id);
      user = app.user;
      const reports = await ReportDefinition.bulkCreate(
        Array(5)
          .fill(null)
          .map((_, i) => fake(ReportDefinition, { id: `report-def-list-test_${i}` })),
      );
      await ReportDefinitionVersion.bulkCreate(reports.map(r => fake(ReportDefinitionVersion, {
        id: `${r.id}_version-1`,
        versionNumber: 1,
        reportDefinitionId: r.id,
        status: REPORT_STATUSES.PUBLISHED,
        query: 'SELECT 1+1 AS test_column',
        queryOptions: JSON.stringify({
          parameters: [],
          dataSources: [],
          defaultDateRange: REPORT_DEFAULT_DATE_RANGES.ALL_TIME,
        }),
        userId: user.id,
      })));
      permittedReports = reports.slice(0, 2);
      restrictedReports = reports.slice(2);
      await Permission.bulkCreate(
        permittedReports.map(r => ({
          roleId: role.id,
          userId: user.id,
          verb: 'run',
          noun: 'ReportDefinition',
          objectId: r.id,
        })),
      );

    });

    afterAll(() => {
      unsetUseHardcodedPermissionsUseForTestsOnly();
    });

    it('should get permitted db and builtin reports', async () => {
      // Act
      const res = await app.get('/v1/reports');

      // Assert
      expect(res).toHaveSucceeded();
      expect(res.body).toHaveLength(permittedReports.length);
      expect(res.body.map(r => r.id).sort()).toEqual(permittedReports.map(
        r => `${r.id}_version-1`,
      ).sort());
    });

    it('should be able to run permitted db reports', async () => {
      // Arrange
      const [version] = await permittedReports[0].getVersions();

      // Act
      const res = await app.post(`/v1/reports/${version.id}`);

      // Assert
      expect(res).toHaveSucceeded();
      expect(res.body).toMatchSnapshot();
    });

    it('should not be able to run restricted db reports', async () => {
      // Arrange
      const [version] = await restrictedReports[0].getVersions();

      // Act
      const res = await app.post(`/v1/reports/${version.id}`);

      // Assert
      expect(res).not.toHaveSucceeded();
      expect(res.body.error).toMatchObject({ message: 'Cannot perform action "run" on ReportDefinition.' });
    });

    it('should be able to run permitted static reports with "read" permissions', async () => {
      // Arrange
      const { Permission } = ctx.models;
      await Permission.create({
        roleId: role.id,
        userId: user.id,
        verb: 'read',
        noun: 'Referral',
      });

      // Act
      const res = await app.post('/v1/reports/incomplete-referrals');

      // Assert
      expect(res).toHaveSucceeded();
    });

    it('should be able to run permitted static reports with "run" permissions', async () => {
      // Arrange
      const { Permission } = ctx.models;
      const reportId = 'admissions';
      await Permission.create({
        roleId: role.id,
        userId: user.id,
        verb: 'run',
        noun: 'StaticReport',
        objectId: reportId,
      });

      // Act
      const res = await app.post(`/v1/reports/${reportId}`);

      // Assert
      expect(res).toHaveSucceeded();            
    });

    it('should not be able to run restricted static reports', async () => {
      // Act
      const res = await app.post(`/v1/reports/appointments-line-list`);      

      // Assert
      expect(res).not.toHaveSucceeded();
      expect(res.body.error).toMatchObject({
        message: 'User does not have permission to run the report',
      });
    });
  });

  describe('post', () => {
    let app = null;
    beforeAll(async () => {
      app = await baseApp.asRole('practitioner');
    });

    it('should reject reading a report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post('/v1/reports/incomplete-referrals', {});
      expect(result).toBeForbidden();
    });
    it('should fail with 400 and message if report module is not found', async () => {
      jest.spyOn(reportsUtils, 'getReportModule').mockResolvedValue(null);
      const res = await app.post('/v1/reports/invalid-report', {});
      expect(res).toHaveStatus(400);
      expect(res.body).toEqual({ error: { message: 'Report module not found' } });
    });
    it('should fail with 400 and error message if dataGenerator encounters error', async () => {
      const res = await app.post('/v1/reports/incomplete-referrals').send({
        parameters: {
          fromDate: '2020-01-01',
          toDate: 'invalid-date',
        },
      });
      expect(res).toHaveStatus(400);
      expect(res.body).toEqual({ error: { message: 'Not a valid date' } });
    });
  });
});
