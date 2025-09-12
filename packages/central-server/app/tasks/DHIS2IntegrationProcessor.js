import config from 'config';
import { fetch } from 'undici';
import { utils } from 'xlsx';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

const reportJSONToCSV = reportData => utils.sheet_to_csv(utils.aoa_to_sheet(reportData));

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

  async postToDHIS2({ reportCSV, dryRun = false }) {
    const { host, username, password } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const params = new URLSearchParams({ dryRun });
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
      {
        // TODO: should i alter these or make them configurable?
        maxAttempts: 3,
        maxWaitMs: 10000,
        multiplierMs: 300,
      },
    );

    return await response.json();
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
      log.warn(`Report: ${reportId} doesn't exist, skipping`);
      return;
    }

    const reportString = `${report.name} (${reportId})`;

    log.info(`Processing report: ${reportString}`);

    if (!report.versions || report.versions.length === 0) {
      log.warn(`Report: ${reportString} has no published version, skipping`);
      return;
    }

    const latestVersion = report.versions[0];
    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task
    const reportCSV = reportJSONToCSV(reportData);

    const { status, message, httpStatusCode, response } = await this.postToDHIS2({
      reportCSV,
      dryRun: true,
      // TODO: This takes a variety of settings we should check if we need like importStrategy, mergeMode, mergeDataValues, etc
    });

    if (httpStatusCode === 200) {
      const { response } = await this.postToDHIS2({ reportCSV });
      const { importCount } = response;
      log.info(`Report: ${reportString} sent to DHIS2 successfully`, importCount);
    } else {
      log.warn(`Dry run failed for report: ${reportString}`, {
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
    const { settings } = this.context;

    const { reportIds } = await settings.get('integrations.dhis2');
    const { host, username, password } = config.integrations.dhis2;

    if (!host || !username || !password) {
      log.warn(`DHIS2 integration not properly configured, skipping`, {
        host: !!host,
        username: !!username,
        password: !!password,
      });
      return;
    }

    log.info(`Sending ${reportIds.length} reports to DHIS2`);

    for (const reportId of reportIds) {
      try {
        await this.processReport(reportId);
      } catch (error) {
        log.error(`Error processing report: ${reportId}`, { error });
      }
    }
  }
}
