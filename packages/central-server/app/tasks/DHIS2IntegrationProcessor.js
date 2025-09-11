import config from 'config';
import { fetch } from 'undici';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// 408: Request Timeout, 500: Internal Server Error, 502: Bad Gateway, 503: Service Unavailable, 504: Gateway Timeout
const RETRY_STATUS_CODES = [408, 500, 502, 503, 504]; // TODO: confirm codes for here
const RETRY_TIMES = 3; // TODO: maybe configurable

// TODO: this is the format
// const EXAMPLE_CSV_DATA = `dataelement,period,orgunit,categoryoptioncombo,attributeoptioncombo,value,storedby,lastupdated,comment,followup,deleted
//     fbfJHSPpUQD,202507,u3qo3VzGIbh,uX9yDetTdOp,HllvX50cXC0,2,bodata1,2010-08-18T00:00:00.000+0000,,false,null`;

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

  async postToDHIS2({ reportData, dryRun = false }, attempt = 1) {
    const { host, username, password } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    // TODO: Validate the report data format?

    const params = new URLSearchParams({ dryRun });
    // TODO: use fetchWithRetryBackoff?
    const response = await fetch(`${host}/api/dataValueSets?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/csv',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: reportData,
    });

    if (response.status === 200) {
      return response;
    }

    if (RETRY_STATUS_CODES.includes(response.status) && attempt < RETRY_TIMES) {
      log.warn(
        `DHIS2 ${dryRun ? 'dry run' : 'post'} failed (${response.status}), retrying... (${attempt}/${RETRY_TIMES})`,
      );
      await sleepAsync(1000 * attempt);
      return this.postToDHIS2({ reportData, dryRun }, attempt + 1);
    }

    // Return the error response if it has not succeeded within the retry limit
    return response;
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

    log.info('Processing report', { reportString });

    if (!report.versions || report.versions.length === 0) {
      log.warn(`Report: ${reportString} has no published version, skipping`);
      return;
    }

    const latestVersion = report.versions[0];
    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task

    // TODO: may need something like this
    // console.log('reportData', reportData.map(row => row.join(',')).join('\n'));

    const { status, statusText } = await this.postToDHIS2({
      reportData,
      dryRun: true,
    });

    if (status === 200) {
      const response = await this.postToDHIS2({ reportData });
      const {
        response: { importCount },
      } = await response.json();
      log.info(`Report: ${reportString} sent to DHIS2`, importCount);
    } else {
      log.warn(`Dry run failed for report: ${reportString}`, { status, statusText });
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

    await Promise.all(reportIds.map(reportId => this.processReport(reportId)));
  }
}
