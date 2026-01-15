import { pick } from 'lodash';

import { createTestContext } from '../utilities';
import {
  DHIS2IntegrationProcessor,
  INFO_LOGS,
  WARNING_LOGS,
  ERROR_LOGS,
  LOG_FIELDS,
  AUDIT_STATUSES,
} from '../../dist/tasks/DHIS2IntegrationProcessor';
import { REPORT_DB_SCHEMAS, REPORT_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '../../../fake-data/dist/mjs/fake/fake';
import { log } from '@tamanu/shared/services/logging';

const mockSuccessResponse = {
  httpStatusCode: 200,
  status: 'success',
  message: 'Report sent to DHIS2 successfully',
  response: {
    importCount: { imported: 2, updated: 0, deleted: 0, ignored: 0 },
    conflicts: [],
  },
};

const mockWarningResponse = {
  httpStatusCode: 409,
  status: 'warning',
  message: 'Report sent to DHIS2 failed',
  response: {
    importCount: { imported: 0, updated: 0, deleted: 0, ignored: 2 },
    conflicts: [
      { value: 'Data element not found: DE123' },
      { value: 'Organisation unit not found: OU456' },
    ],
  },
};

describe('DHIS2 integration processor', () => {
  let ctx;
  let models;
  let dhis2IntegrationProcessor;
  let report;
  let reportVersion;
  let logSpy;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    logSpy = {
      info: jest.spyOn(log, 'info'),
      warn: jest.spyOn(log, 'warn'),
      error: jest.spyOn(log, 'error'),
    };

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
        status: REPORT_STATUSES.PUBLISHED,
      }),
    );
  });

  const setHost = async host => {
    await models.Setting.set('integrations.dhis2.host', host, SETTINGS_SCOPES.CENTRAL);
  };

  const setReportIds = async reportIds => {
    await models.Setting.set('integrations.dhis2.reportIds', reportIds, SETTINGS_SCOPES.CENTRAL);
  };

  const setBackoff = async backoff => {
    await models.Setting.set('integrations.dhis2.backoff', backoff, SETTINGS_SCOPES.CENTRAL);
  };

  const setAutoCompleteDataSets = async autoComplete => {
    await models.Setting.set(
      'integrations.dhis2.autoCompleteDataSets',
      autoComplete,
      SETTINGS_SCOPES.CENTRAL,
    );
  };

  const setDataSetMappings = async mappings => {
    await models.Setting.set(
      'integrations.dhis2.dataSetMappings',
      mappings,
      SETTINGS_SCOPES.CENTRAL,
    );
  };

  beforeEach(async () => {
    await setHost('test host');
    await setReportIds([report.id]);
    await setBackoff({ multiplierMs: 50, maxAttempts: 2, maxWaitMs: 10000 });
    await setAutoCompleteDataSets(true);
    await setDataSetMappings({});
    await reportVersion.update({ status: REPORT_STATUSES.PUBLISHED });
    await models.DHIS2PushLog.truncate();
    dhis2IntegrationProcessor = new DHIS2IntegrationProcessor(ctx);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
    ctx.close();
  });

  describe('configuration', () => {
    it('should skip if missing host in settings', async () => {
      await setHost('');
      await dhis2IntegrationProcessor.run();

      expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
        enabled: true,
        host: false,
        username: true,
        password: true,
        reportIds: 1,
      });
    });

    it('should skip if no reportIds in settings', async () => {
      await setReportIds([]);
      await dhis2IntegrationProcessor.run();
      expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
        enabled: true,
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
      await reportVersion.update({ status: REPORT_STATUSES.DRAFT });
      await dhis2IntegrationProcessor.run();

      expect(logSpy.warn).toHaveBeenLastCalledWith(WARNING_LOGS.REPORT_HAS_NO_PUBLISHED_VERSION, {
        report: `Test Report (${report.id})`,
      });

      await reportVersion.update({ status: REPORT_STATUSES.PUBLISHED });
      await dhis2IntegrationProcessor.run();

      expect(logSpy.info).toHaveBeenCalledWith(INFO_LOGS.PROCESSING_REPORT, {
        report: `Test Report (${report.id})`,
      });
    });
  });

  describe('connection', () => {
    it("should log.error if we can't establish a connection to DHIS2", async () => {
      await dhis2IntegrationProcessor.run();

      expect(logSpy.error).toHaveBeenLastCalledWith(ERROR_LOGS.ERROR_PROCESSING_REPORT, {
        reportId: report.id,
        error: expect.any(Error),
      });
    });

    it('should retry based on the backoff settings in config', async () => {
      await dhis2IntegrationProcessor.run();

      for (let i = 1; i < 2; i++) {
        expect(logSpy.warn).toHaveBeenCalledWith('fetchWithRetryBackoff: failed, retrying', {
          attempt: i,
          maxAttempts: 2,
          retryingIn: `50ms`,
          url: expect.any(String),
          stack: expect.any(String),
        });
      }

      expect(logSpy.error).toHaveBeenCalledWith(
        'fetchWithRetryBackoff: failed, max retries exceeded',
        {
          attempt: 2,
          maxAttempts: 2,
          url: expect.any(String),
          stack: expect.any(String),
        },
      );
    });
  });

  describe('DHIS2 response', () => {
    it('should log.warn individual conflicts when DHIS2 returns conflicts', async () => {
      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockWarningResponse);
      await dhis2IntegrationProcessor.run();

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);

      expect(logSpy.warn).toHaveBeenCalledWith(
        WARNING_LOGS.FAILED_TO_SEND_REPORT,
        pick(pushLogs[0], LOG_FIELDS),
      );
      expect(logSpy.warn).toHaveBeenCalledWith('Data element not found: DE123');
      expect(logSpy.warn).toHaveBeenCalledWith('Organisation unit not found: OU456');
    });

    it('should log.info with the importCount if we get a 200 response from DHIS2', async () => {
      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);

      await dhis2IntegrationProcessor.run();

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);

      const { importCount } = mockSuccessResponse.response;
      expect(pushLogs[0]).toMatchObject({
        status: 'success',
        ...importCount,
      });
      expect(logSpy.info).toHaveBeenLastCalledWith(
        INFO_LOGS.SUCCESSFULLY_SENT_REPORT,
        pick(pushLogs[0], LOG_FIELDS),
      );
    });
  });

  describe('auditing', () => {
    it('should create a failure log when cant connect to DHIS2', async () => {
      await dhis2IntegrationProcessor.run();

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);

      expect(pushLogs[0]).toMatchObject({
        status: AUDIT_STATUSES.FAILURE,
      });
    });

    it('should create a warning log when conflicts are returned in DHIS2', async () => {
      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockWarningResponse);
      await dhis2IntegrationProcessor.run();

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);

      const {
        response: { importCount, conflicts },
      } = mockWarningResponse;
      expect(pushLogs[0]).toMatchObject({
        status: AUDIT_STATUSES.WARNING,
        conflicts: conflicts.map(conflict => conflict.value),
        ...importCount,
      });
    });

    it('should create a success log when report is successfully sent to DHIS2', async () => {
      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);
      await dhis2IntegrationProcessor.run();

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);

      const { importCount } = mockSuccessResponse.response;
      expect(pushLogs[0]).toMatchObject({
        status: AUDIT_STATUSES.SUCCESS,
        ...importCount,
      });
    });
  });

  describe('dataset completion', () => {
    const mockReportData = [
      ['dataElement', 'period', 'orgUnit', 'value'],
      ['DE1', '202501', 'OU1', '10'],
      ['DE2', '202501', 'OU1', '20'],
      ['DE3', '202501', 'OU2', '30'],
      ['DE4', '202502', 'OU1', '40'],
    ];

    it('should extract unique period/orgUnit registrations with configured dataset', () => {
      const registrations = dhis2IntegrationProcessor.extractDataSetRegistrations(
        mockReportData,
        'DS1',
      );

      expect(registrations).toHaveLength(3);
      expect(registrations).toEqual(
        expect.arrayContaining([
          { dataSet: 'DS1', period: '202501', orgUnit: 'OU1' },
          { dataSet: 'DS1', period: '202501', orgUnit: 'OU2' },
          { dataSet: 'DS1', period: '202502', orgUnit: 'OU1' },
        ]),
      );
    });

    it('should return empty array when no dataSetId is provided', () => {
      const registrations = dhis2IntegrationProcessor.extractDataSetRegistrations(
        mockReportData,
        null,
      );

      expect(registrations).toHaveLength(0);
    });

    it('should return empty array when report has no period/orgUnit columns', () => {
      const reportDataWithoutColumns = [
        ['dataElement', 'value'],
        ['DE1', '10'],
      ];

      const registrations = dhis2IntegrationProcessor.extractDataSetRegistrations(
        reportDataWithoutColumns,
        'DS1',
      );

      expect(registrations).toHaveLength(0);
    });

    it('should complete datasets after successful data push when enabled and configured', async () => {
      await setDataSetMappings({ [report.id]: 'DS1' });

      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);
      dhis2IntegrationProcessor.extractDataSetRegistrations = jest.fn().mockReturnValue([
        { dataSet: 'DS1', period: '202501', orgUnit: 'OU1' },
      ]);
      dhis2IntegrationProcessor.completeDataSetsInDHIS2 = jest
        .fn()
        .mockResolvedValue({ completedCount: 1, errors: [] });

      await dhis2IntegrationProcessor.run();

      expect(dhis2IntegrationProcessor.extractDataSetRegistrations).toHaveBeenCalledWith(
        expect.any(Array),
        'DS1',
      );
      expect(dhis2IntegrationProcessor.completeDataSetsInDHIS2).toHaveBeenCalledWith([
        { dataSet: 'DS1', period: '202501', orgUnit: 'OU1' },
      ]);

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);
      expect(pushLogs[0]).toMatchObject({
        status: AUDIT_STATUSES.SUCCESS,
        dataSetsCompleted: 1,
      });
    });

    it('should not complete datasets when autoCompleteDataSets is disabled', async () => {
      await setAutoCompleteDataSets(false);
      await setDataSetMappings({ [report.id]: 'DS1' });

      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);
      dhis2IntegrationProcessor.completeDataSetsInDHIS2 = jest.fn();

      await dhis2IntegrationProcessor.run();

      expect(dhis2IntegrationProcessor.completeDataSetsInDHIS2).not.toHaveBeenCalled();
    });

    it('should not complete datasets when no mapping is configured for the report', async () => {
      await setDataSetMappings({});

      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);
      dhis2IntegrationProcessor.completeDataSetsInDHIS2 = jest.fn();

      await dhis2IntegrationProcessor.run();

      expect(dhis2IntegrationProcessor.completeDataSetsInDHIS2).not.toHaveBeenCalled();
      expect(logSpy.warn).toHaveBeenCalledWith(
        WARNING_LOGS.NO_DATA_SETS_TO_COMPLETE,
        expect.objectContaining({
          report: expect.any(String),
          reason: 'No dataset mapping configured for this report',
        }),
      );
    });

    it('should log errors when dataset completion fails', async () => {
      await setDataSetMappings({ [report.id]: 'DS1' });

      const completionErrors = [
        {
          message: 'Dataset not found',
        },
      ];

      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);
      dhis2IntegrationProcessor.extractDataSetRegistrations = jest.fn().mockReturnValue([
        { dataSet: 'DS1', period: '202501', orgUnit: 'OU1' },
      ]);
      dhis2IntegrationProcessor.completeDataSetsInDHIS2 = jest
        .fn()
        .mockResolvedValue({ completedCount: 0, errors: completionErrors });

      await dhis2IntegrationProcessor.run();

      const pushLogs = await models.DHIS2PushLog.findAll({ raw: true });
      expect(pushLogs).toHaveLength(1);
      expect(pushLogs[0]).toMatchObject({
        status: AUDIT_STATUSES.SUCCESS,
        dataSetsCompleted: 0,
        dataSetCompletionErrors: completionErrors,
      });

      expect(logSpy.warn).toHaveBeenCalledWith(
        WARNING_LOGS.FAILED_TO_COMPLETE_DATA_SETS,
        expect.objectContaining({
          completed: 0,
          failed: 1,
        }),
      );
    });

    it('should warn when report has no period/orgUnit combinations', async () => {
      await setDataSetMappings({ [report.id]: 'DS1' });

      dhis2IntegrationProcessor.postToDHIS2 = jest.fn().mockResolvedValue(mockSuccessResponse);
      dhis2IntegrationProcessor.extractDataSetRegistrations = jest.fn().mockReturnValue([]);

      await dhis2IntegrationProcessor.run();

      expect(logSpy.warn).toHaveBeenCalledWith(
        WARNING_LOGS.NO_DATA_SETS_TO_COMPLETE,
        expect.objectContaining({
          report: expect.any(String),
          reason: 'No period/orgUnit combinations found in report data',
        }),
      );
    });
  });
});
