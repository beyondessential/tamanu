import { createTestContext } from '../utilities';
import {
  DHIS2IntegrationProcessor,
  INFO_LOGS,
  WARNING_LOGS,
  ERROR_LOGS,
} from '../../dist/tasks/DHIS2IntegrationProcessor';
import { REPORT_DB_SCHEMAS, REPORT_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '../../../fake-data/dist/mjs/fake/fake';
import { log } from '@tamanu/shared/services/logging';

const logSpy = {
  info: jest.spyOn(log, 'info'),
  warn: jest.spyOn(log, 'warn'),
  error: jest.spyOn(log, 'error'),
};

const mockDhis2Response = ({ code, conflicts = [] }) =>
  jest.fn().mockResolvedValue({
    httpStatusCode: code,
    status: code === 200 ? 'success' : 'warning',
    message: code === 200 ? 'Report sent to DHIS2 successfully' : 'Report sent to DHIS2 failed',
    response: {
      importCount: { imported: 0, updated: 0, deleted: 0, ignored: conflicts.length },
      conflicts,
    },
  });

describe('DHIS2 integration processor', () => {
  let ctx;
  let models;
  let dhis2IntegrationProcessor;
  let report;
  let reportVersion;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    dhis2IntegrationProcessor = new DHIS2IntegrationProcessor(ctx);

    report = await models.ReportDefinition.create({
      name: 'Test Report',
      dbSchema: REPORT_DB_SCHEMAS.RAW,
    });
    reportVersion = await models.ReportDefinitionVersion.create(
      fake(models.ReportDefinitionVersion, {
        reportDefinitionId: report.id,
        userId: (await models.User.create(fake(models.User))).id,
        queryOptions: JSON.stringify({
          parameters: [],
          defaultDateRange: 'allTime',
        }),
        query: 'SELECT id, email from users;',
        status: REPORT_STATUSES.DRAFT,
      }),
    );
  });

  const setHost = async host => {
    await models.Setting.set('integrations.dhis2.host', host, SETTINGS_SCOPES.CENTRAL);
  };

  const setReportIds = async reportIds => {
    await models.Setting.set('integrations.dhis2.reportIds', reportIds, SETTINGS_SCOPES.CENTRAL);
  };

  beforeEach(async () => {
    await setHost('https://test.dhis2.org');
  });

  afterEach(() => {
    Object.values(logSpy).forEach(spy => spy.mockClear());
  });

  afterAll(() => {
    Object.values(logSpy).forEach(spy => spy.mockRestore());
    ctx.close();
  });

  it('should skip if missing host in settings', async () => {
    await models.Setting.set('integrations.dhis2.host', '', SETTINGS_SCOPES.CENTRAL);
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
      host: false,
      username: true,
      password: true,
      reportIds: 0,
    });
  });

  it('should skip if no reportIds in settings', async () => {
    await dhis2IntegrationProcessor.run();
    expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
      host: true,
      username: true,
      password: true,
      reportIds: 0,
    });
  });

  it('should check that all reports to be processed exist', async () => {
    await setReportIds(['non-existent-report-id']);
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.REPORT_DOES_NOT_EXIST, {
      reportId: 'non-existent-report-id',
    });

    await setReportIds([report.id]);
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.REPORT_HAS_NO_PUBLISHED_VERSION, {
      report: `Test Report (${report.id})`,
    });

    await reportVersion.update({ status: REPORT_STATUSES.PUBLISHED });
    await dhis2IntegrationProcessor.run();

    expect(logSpy.info).toHaveBeenLastCalledWith(INFO_LOGS.PROCESSING_REPORT, {
      report: `Test Report (${report.id})`,
    });
  });

  it('should log.error if we cant establish a connection to DHIS2', async () => {
    await setHost('https://invalid-host.com');
    await dhis2IntegrationProcessor.run();

    expect(logSpy.error).toHaveBeenLastCalledWith(ERROR_LOGS.ERROR_PROCESSING_REPORT, {
      reportId: report.id,
      error: expect.any(Error),
    });
  });

  it('should log.warning if we get a non-200 response from DHIS2 for a report', async () => {
    dhis2IntegrationProcessor.postToDHIS2 = mockDhis2Response({ code: 409 });
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.FAILED_TO_SEND_REPORT, {
      report: `Test Report (${report.id})`,
      message: 'Report sent to DHIS2 failed',
      status: 'warning',
      httpStatusCode: 409,
    });
  });

  it('should log individual conflicts when DHIS2 returns conflicts', async () => {
    dhis2IntegrationProcessor.postToDHIS2 = mockDhis2Response({
      code: 409,
      conflicts: [
        { value: 'Data element not found: DE123' },
        { value: 'Organisation unit not found: OU456' },
      ],
    });
    await dhis2IntegrationProcessor.run();

    expect(logSpy.warn).toHaveBeenCalledWith('Data element not found: DE123');
    expect(logSpy.warn).toHaveBeenCalledWith('Organisation unit not found: OU456');
  });

  it('should log.info with the importCount if we get a 200 response from DHIS2', async () => {
    dhis2IntegrationProcessor.postToDHIS2 = mockDhis2Response({
      code: 200,
      conflicts: [],
    });

    await dhis2IntegrationProcessor.run();

    expect(logSpy.info).toHaveBeenLastCalledWith(INFO_LOGS.SUCCESSFULLY_SENT_REPORT, {
      report: `Test Report (${report.id})`,
      imported: 0,
      updated: 0,
      deleted: 0,
      ignored: 0,
    });
  });
});
