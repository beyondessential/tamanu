import config from 'config';
import { fetch } from 'undici';
import { utils } from 'xlsx';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';

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

  async postToDHIS2(reportCSV) {
    const { host, username, password } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    // TODO: This takes a variety of params we should check if we need like importStrategy, mergeMode, mergeDataValues, etc
    const response = await fetch(`${host}/api/dataValueSets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/csv',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: reportCSV,
    });

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
      log.warn(`DHIS2IntegrationProcessor: Report doesn't exist, skipping`, { reportId });
      return;
    }

    const reportString = `${report.name} (${reportId})`;

    log.info(`DHIS2IntegrationProcessor: Processing report`, { report: reportString });

    if (!report.versions || report.versions.length === 0) {
      log.warn(`DHIS2IntegrationProcessor: Report has no published version, skipping`, {
        report: reportString,
      });
      return;
    }

    const latestVersion = report.versions[0];
    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task
    const reportCSV = reportJSONToCSV(reportData);

    const { status, message, httpStatusCode, response } = await this.postToDHIS2(reportCSV);

    if (httpStatusCode === 200) {
      log.info(`DHIS2IntegrationProcessor: Report sent to DHIS2 successfully`, {
        report: reportString,
        importCount: response.importCount,
      });
    } else {
      log.warn(`DHIS2IntegrationProcessor: Failed to send report to DHIS2`, {
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
    const { settings } = this.context;

    const { reportIds } = await settings.get('integrations.dhis2');
    const { host, username, password } = config.integrations.dhis2;

    if (!host || !username || !password) {
      log.warn(`DHIS2IntegrationProcessor: DHIS2 integration not properly configured, skipping`, {
        host: !!host,
        username: !!username,
        password: !!password,
      });
      return;
    }

    log.info(`DHIS2IntegrationProcessor: Sending ${reportIds.length} reports to DHIS2`);

    for (const reportId of reportIds) {
      try {
        await this.processReport(reportId);
      } catch (error) {
        log.error(`DHIS2IntegrationProcessor: Error processing report`, {
          reportId,
          error,
        });
      }
    }
  }
}
