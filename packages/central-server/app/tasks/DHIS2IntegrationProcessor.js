import config from 'config';
import { fetch } from 'undici';
import { utils } from 'xlsx';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

const arrayOfArraysToCSV = reportData => utils.sheet_to_csv(utils.aoa_to_sheet(reportData));

export const INFO_LOGS = {
  SENDING_REPORTS: 'DHIS2IntegrationProcessor: Sending reports to DHIS2',
  PROCESSING_REPORT: 'DHIS2IntegrationProcessor: Processing report',
  SUCCESSFULLY_SENT_REPORT: 'DHIS2IntegrationProcessor: Report sent to DHIS2 successfully',
};

export const WARNING_LOGS = {
  INTEGRATION_NOT_CONFIGURED:
    'DHIS2IntegrationProcessor: DHIS2 integration not properly configured, skipping',
  REPORT_DOES_NOT_EXIST: "DHIS2IntegrationProcessor: Report doesn't exist, skipping",
  REPORT_HAS_NO_PUBLISHED_VERSION:
    'DHIS2IntegrationProcessor: Report has no published version, skipping',
  FAILED_TO_SEND_REPORT: 'DHIS2IntegrationProcessor: Failed to send report to DHIS2',
};

export const ERROR_LOGS = {
  ERROR_PROCESSING_REPORT: 'DHIS2IntegrationProcessor: Error processing report',
};

export class DHIS2IntegrationProcessor extends ScheduledTask {
  getName() {
    return 'DHIS2IntegrationProcessor';
  }

  constructor(context) {
    const conf = config.schedules.dhis2IntegrationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
  }

  async logDHIS2Push({ reportId, status, importCount, conflicts, message }) {
    const {
      store: { models },
    } = this.context;
    const { imported, updated, ignored, deleted } = importCount;
    await models.DHIS2PushLog.create({
      reportId,
      status,
      message,
      imported,
      updated,
      ignored,
      deleted,
      conflicts: JSON.stringify(conflicts),
    });
  }

  async postToDHIS2({ reportId, reportCSV }) {
    const { idSchemes, host } = await this.context.settings.get('integrations.dhis2');
    const { username, password, backoff } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const params = new URLSearchParams({ ...idSchemes, importStrategy: 'CREATE_AND_UPDATE' });
    try {
      const response = await fetchWithRetryBackoff(
        `${host}/api/dataValueSets?${params.toString()}`,
        {
          fetch,
          method: 'POST',
          headers: {
            'Content-Type': 'application/csv',
            Accept: 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: reportCSV,
        },
        { ...backoff, log },
      );

      return await response.json();
    } catch (error) {
      await this.logDHIS2Push({
        reportId,
        status: 'error',
        message: error.message,
        importCount: { imported: 0, updated: 0, deleted: 0, ignored: 0 },
        conflicts: [],
      });
      throw error;
    }
  }

  async processReport(reportId) {
    const {
      store: { models, sequelize },
    } = this.context;

    const report = await models.ReportDefinition.findByPk(reportId, {
      include: [
        {
          model: models.ReportDefinitionVersion,
          as: 'versions',
          where: { status: REPORT_STATUSES.PUBLISHED },
          order: [['createdAt', 'DESC']],
          limit: 1,
          separate: true,
        },
      ],
    });

    if (!report) {
      log.warn(WARNING_LOGS.REPORT_DOES_NOT_EXIST, { reportId });
      return;
    }

    const reportString = `${report.name} (${reportId})`;

    if (!report.versions || report.versions.length === 0) {
      log.warn(WARNING_LOGS.REPORT_HAS_NO_PUBLISHED_VERSION, {
        report: reportString,
      });
      return;
    }

    log.info(INFO_LOGS.PROCESSING_REPORT, { report: reportString });

    const latestVersion = report.versions[0];
    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task
    const reportCSV = arrayOfArraysToCSV(reportData);

    const dhis2Response = await this.postToDHIS2({ reportId, reportCSV });
    const { status, message, httpStatusCode, response } = dhis2Response;
    await this.logDHIS2Push({
      reportId,
      status,
      message,
      importCount: response.importCount,
      conflicts: response.conflicts.map(conflict => conflict.value),
    });

    console.log({ status, message, httpStatusCode, response });

    if (httpStatusCode === 200) {
      log.info(INFO_LOGS.SUCCESSFULLY_SENT_REPORT, {
        report: reportString,
        ...response.importCount,
      });
    } else {
      log.warn(WARNING_LOGS.FAILED_TO_SEND_REPORT, {
        report: reportString,
        message,
        status,
        httpStatusCode,
      });

      // Value is the error message returned from DHIS2 api for each errored row
      const { conflicts = [] } = response;
      conflicts.forEach(conflict => log.warn(conflict.value));
    }
  }

  async run() {
    const { reportIds, host } = await this.context.settings.get('integrations.dhis2');
    const { enabled, username, password } = config.integrations.dhis2;

    if (!enabled || !host || !username || !password || reportIds.length === 0) {
      log.warn(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
        enabled: !!enabled,
        host: !!host,
        username: !!username,
        password: !!password,
        reportIds: reportIds.length,
      });
      return;
    }

    log.info(INFO_LOGS.SENDING_REPORTS, {
      count: reportIds.length,
    });

    for (const reportId of reportIds) {
      try {
        await this.processReport(reportId);
      } catch (error) {
        log.error(ERROR_LOGS.ERROR_PROCESSING_REPORT, {
          reportId,
          error,
        });
      }
    }
  }
}
