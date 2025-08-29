import config from 'config';
import { fetch } from 'undici';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';

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

  async postToDHIS2({ reportId, reportData, dryRun = false }) {
    try {
      const { host, username, password } = config.integrations.dhis2;
      const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

      const params = new URLSearchParams({ dryRun });
      const response = await fetch(`${host}/api/dataValueSets?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          Accept: 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: reportData,
      });

      console.log(response);

      if (response.status === 200) {
        log.info(`Successfully sent report ${reportId} to DHIS2`);
      } else {
        log.warn(`Error received from DHIS2 for report ${reportId}`);
      }
      return response;
    } catch (error) {
      log.error(`Error sending report ${reportId} to DHIS2`, { error: error.message });
      return error;
    }
  }

  async run() {
    try {
      const {
        settings,
        store: { models, sequelize },
      } = this.context;

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
          log.warn(`Report ${reportId} doesn't exist, skipping`);
          continue;
        }

        log.info('Processing report', { reportId });

        if (!report.versions || report.versions.length === 0) {
          log.warn(`Report ${reportId} has no published version, skipping`);
          continue;
        }

        const latestVersion = report.versions[0];
        const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {});

        const dryRunResponse = await this.postToDHIS2({ reportId, reportData, dryRun: true });
        if (dryRunResponse.status === 200) {
          await this.postToDHIS2({ reportId, reportData });
        } else {
          log.warn(`Dry run DHIS2 integration failed for report ${reportId}`);
        }
      }
    } catch (error) {
      log.error('Error in DHIS2 integration processing', { error: error.message });
      throw error;
    }
  }
}
