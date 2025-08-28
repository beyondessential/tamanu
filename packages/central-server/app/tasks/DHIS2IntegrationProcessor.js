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

  async postToDHIS(reportId, reportData) {
    try {
      const response = await fetch('https://dhis2.tamantestnotreal.cd/api/dataValueSets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          dataValues: reportData,
          reportId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.status === 200) {
        const responseData = await response.json();
        log.info(`Successfully sent report ${reportId} to DHIS2`, { responseData });
        return true;
      } else {
        log.warn(`Failed to send report ${reportId} to DHIS2`, {
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }
    } catch (dhis2Error) {
      log.error(`Error sending report ${reportId} to DHIS2`, { error: dhis2Error.message });
      return false;
    }
  }

  async run() {
    try {
      const {
        settings,
        store: { models, sequelize },
      } = this.context;

      const { reportIds } = await settings.get('integrations.dhis2');

      log.info(`Processing DHIS2 integration for ${reportIds.length} reports`);

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

        // Send data to DHIS2
        await this.postToDHIS(reportId, reportData);

        log.info(`Report ${reportId} CSV Data: ${JSON.stringify(reportData)}`);
      }

      log.info('DHIS2 integration processing completed');
    } catch (error) {
      log.error('Error in DHIS2 integration processing', { error: error.message });
      throw error;
    }
  }
}
