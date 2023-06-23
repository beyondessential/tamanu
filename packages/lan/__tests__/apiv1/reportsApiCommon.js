import { fake } from 'shared/test-helpers';
import { REPORT_STATUSES, REPORT_DEFAULT_DATE_RANGES } from 'shared/constants';
import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from 'shared/permissions/rolesToPermissions';

export function testReportPermissions(getCtx, makeRequest) {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    setHardcodedPermissionsUseForTestsOnly(false);
    ctx = getCtx();
    baseApp = ctx.baseApp;
  });

  afterAll(() => {
    unsetUseHardcodedPermissionsUseForTestsOnly();
  });

  describe('db reports', () => {
    let app;
    let permittedReports;
    let restrictedReports;

    beforeAll(async () => {
      const { models } = ctx;
      const data = await setupReportPermissionsTest(baseApp, models);
      app = data.app;
      permittedReports = data.permittedReports;
      restrictedReports = data.restrictedReports;
    });

    it('should be able to run permitted reports', async () => {
      // Arrange
      const [version] = await permittedReports[0].getVersions();

      // Act
      const res = await makeRequest(app, version.id);

      // Assert
      expect(res).toHaveSucceeded();
    });

    it('should not be able to run restricted reports', async () => {
      // Arrange
      const [version] = await restrictedReports[0].getVersions();

      // Act
      const res = await makeRequest(app, version.id);

      // Assert
      expect(res).toBeForbidden();
      expect(res.body.error).toMatchObject({
        message: 'Cannot perform action "run" on ReportDefinition.',
      });
    });
  });

  describe('static reports', () => {
    let app;
    beforeAll(async () => {
      app = await baseApp.asNewRole([
        ['run', 'StaticReport', 'admissions'],
        ['read', 'Referral'],
      ]);
    });

    it('should be able to run permitted reports with "read" permissions', async () => {
      // Act
      const res = await makeRequest(app, 'incomplete-referrals');

      // Assert
      expect(res).toHaveSucceeded();
    });

    it('should be able to run permitted static reports with "run" permissions', async () => {
      // Act
      const res = await makeRequest(app, 'admissions');

      // Assert
      expect(res).toHaveSucceeded();
    });

    it('should not be able to run restricted static reports', async () => {
      // Act
      const res = await makeRequest(app, 'appointments-line-list');

      // Assert
      expect(res).toBeForbidden();
      expect(res.body.error).toMatchObject({
        message: 'User does not have permission to run the report',
      });
    });
  });
}

export async function setupReportPermissionsTest(baseApp, models) {
  const { User, ReportDefinition, ReportDefinitionVersion } = models;
  const owner = await User.create(fake(User));
  const reports = await ReportDefinition.bulkCreate(
    Array(5)
      .fill(null)
      .map(() => fake(ReportDefinition)),
  );
  await ReportDefinitionVersion.bulkCreate(
    reports.map(r =>
      fake(ReportDefinitionVersion, {
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
        userId: owner.id,
      }),
    ),
  );
  const permittedReports = reports.slice(0, 2);
  const restrictedReports = reports.slice(2);
  const app = await baseApp.asNewRole(permittedReports.map(r => ['run', 'ReportDefinition', r.id]));
  return { app, role: app.role, user: app.user, permittedReports, restrictedReports };
}
