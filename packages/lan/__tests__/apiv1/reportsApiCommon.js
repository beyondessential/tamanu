import { fake } from 'shared/test-helpers';
import { REPORT_STATUSES, REPORT_DEFAULT_DATE_RANGES } from 'shared/constants';
import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from 'shared/permissions/rolesToPermissions';

export function testReportPermissions(getCtx, makeRequest) {
  let ctx;
  let app;
  let user;
  let permittedReports;
  let restrictedReports;
  let role;

  beforeAll(async () => {
    setHardcodedPermissionsUseForTestsOnly(false);
    ctx = getCtx();
    const { baseApp, models } = ctx;
    const data = await setupReportPermissionsTest(baseApp, models);
    app = data.app;
    user = data.user;
    permittedReports = data.permittedReports;
    restrictedReports = data.restrictedReports;
    role = data.role;
  });

  afterAll(() => {
    unsetUseHardcodedPermissionsUseForTestsOnly();
  });

  it('should be able to run permitted db reports', async () => {
    // Arrange
    const [version] = await permittedReports[0].getVersions();

    // Act
    const res = await makeRequest(app, version.id);

    // Assert
    expect(res).toHaveSucceeded();
    expect(res.body).toMatchSnapshot();
  });

  it('should not be able to run restricted db reports', async () => {
    // Arrange
    const [version] = await restrictedReports[0].getVersions();

    // Act
    const res = await makeRequest(app, version.id);

    // Assert
    expect(res).not.toHaveSucceeded();
    expect(res.body.error).toMatchObject({
      message: 'Cannot perform action "run" on ReportDefinition.',
    });
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
    const res = await makeRequest(app, 'incomplete-referrals');

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
    const res = await makeRequest(app, reportId);

    // Assert
    expect(res).toHaveSucceeded();
  });

  it('should not be able to run restricted static reports', async () => {
    // Act
    const res = await makeRequest(app, 'appointments-line-list');

    // Assert
    expect(res).not.toHaveSucceeded();
    expect(res.body.error).toMatchObject({
      message: 'User does not have permission to run the report',
    });
  });
}

export async function setupReportPermissionsTest(baseApp, models) {
  const { Role, Permission, ReportDefinition, ReportDefinitionVersion } = models;
  const role = await Role.create(fake(Role));
  const app = await baseApp.asRole(role.id);
  const { user } = app;
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
        userId: user.id,
      }),
    ),
  );
  const permittedReports = reports.slice(0, 2);
  const restrictedReports = reports.slice(2);
  await Permission.bulkCreate(
    permittedReports.map(r => ({
      roleId: role.id,
      userId: user.id,
      verb: 'run',
      noun: 'ReportDefinition',
      objectId: r.id,
    })),
  );
  return { app, role, user, permittedReports, restrictedReports };
}
