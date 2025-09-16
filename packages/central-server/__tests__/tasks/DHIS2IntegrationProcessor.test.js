import { createTestContext } from '../utilities';
import {
  DHIS2IntegrationProcessor,
  INFO_LOGS,
  WARNING_LOGS,
  ERROR_LOGS,
} from '../../app/tasks/Dhis2IntegrationProcessor';
import { REPORT_DB_SCHEMAS, REPORT_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '../../../fake-data/dist/mjs/fake/fake';
import { log } from '@tamanu/shared/services/logging';

describe('DHIS2 integration processor', () => {
  let ctx;
  let models;
  let dhis2IntegrationProcessor;
  let user;
  let report;
  let reportVersion;
  let logSpy;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    dhis2IntegrationProcessor = new DHIS2IntegrationProcessor(ctx);
    user = await models.User.create(fake(models.User));

    report = await models.ReportDefinition.create({
      name: 'Test Report',
      dbSchema: REPORT_DB_SCHEMAS.RAW,
    });
    reportVersion = await models.ReportDefinitionVersion.create(
      fake(models.ReportDefinitionVersion, {
        reportDefinitionId: report.id,
        userId: user.id,
        queryOptions: JSON.stringify({
          parameters: [{ parameterField: 'EmailField', name: 'email' }],
          defaultDateRange: 'allTime',
        }),
        query:
          'SELECT id, email from users WHERE CASE WHEN :email IS NOT NULL THEN email = :email ELSE TRUE END;',
        status: REPORT_STATUSES.PUBLISHED,
      }),
    );

    // Spy on the log methods
    logSpy = {
      info: jest.spyOn(log, 'info'),
      warn: jest.spyOn(log, 'warn'),
      error: jest.spyOn(log, 'error'),
    };
  });

  beforeEach(async () => {
    await models.Setting.set(
      'integrations.dhis2.host',
      'https://test.dhis2.org',
      SETTINGS_SCOPES.CENTRAL,
    );
  });

  afterEach(() => {
    // Clear all spy calls between tests
    Object.values(logSpy).forEach(spy => spy.mockClear());
  });

  afterAll(() => {
    // Restore all spies
    Object.values(logSpy).forEach(spy => spy.mockRestore());
    ctx.close();
  });

  it('should skip if missing host, username, or password', async () => {
    await models.Setting.set('integrations.dhis2.host', '', SETTINGS_SCOPES.CENTRAL);

    await dhis2IntegrationProcessor.run();
    expect(logSpy.warn).toHaveBeenCalledWith(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
      host: false,
      username: true,
      password: true,
      reportIds: 0,
    });
  });

  it('should check that all reports to be processed exist', async () => {
    await models.Setting.set(
      'integrations.dhis2.reportIds',
      ['non-existent-report-id'],
      SETTINGS_SCOPES.CENTRAL,
    );
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenCalledWith(WARNING_LOGS.REPORT_DOES_NOT_EXIST, {
      reportId: 'non-existent-report-id',
    });

    await models.Setting.set('integrations.dhis2.reportIds', [report.id], SETTINGS_SCOPES.CENTRAL);
    await reportVersion.update({ status: REPORT_STATUSES.DRAFT });
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenCalledWith(WARNING_LOGS.REPORT_HAS_NO_PUBLISHED_VERSION, {
      report: `Test Report (${report.id})`,
    });

    await reportVersion.update({ status: REPORT_STATUSES.PUBLISHED });
    await dhis2IntegrationProcessor.run();

    expect(logSpy.info).toHaveBeenCalledWith(INFO_LOGS.PROCESSING_REPORT, {
      report: `Test Report (${report.id})`,
    });
  });

  it('should log failure if we cant connect to DHIS2', async () => {
    await models.Setting.set(
      'integrations.dhis2.host',
      'https://invalid-host.com',
      SETTINGS_SCOPES.CENTRAL,
    );

    await dhis2IntegrationProcessor.run();

    expect(logSpy.error).toHaveBeenCalledWith(ERROR_LOGS.ERROR_PROCESSING_REPORT, {
      reportId: report.id,
      error: expect.any(Error),
    });
  });

  it('should warn if we get a non-200 response from DHIS2 for a report', async () => {
    dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue({
      httpStatusCode: 409,
      status: 'warning',
      message: 'Report sent to DHIS2 failed',
      response: {
        conflicts: [],
      },
    });

    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenCalledWith(WARNING_LOGS.FAILED_TO_SEND_REPORT, {
      report: `Test Report (${report.id})`,
      message: 'Report sent to DHIS2 failed',
      status: 'warning',
      httpStatusCode: 409,
    });
  });

  it('should log success if we get a 200 response from DHIS2', async () => {
    dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue({
      httpStatusCode: 200,
      status: 'success',
      message: 'Report sent to DHIS2 successfully',
      response: {
        importCount: { imported: 1, updated: 0, deleted: 0 },
      },
    });

    await dhis2IntegrationProcessor.run();

    expect(logSpy.info).toHaveBeenLastCalledWith(INFO_LOGS.SUCCESSFULLY_SENT_REPORT, {
      report: `Test Report (${report.id})`,
      imported: 1,
      updated: 0,
      deleted: 0,
    });
  });
});
