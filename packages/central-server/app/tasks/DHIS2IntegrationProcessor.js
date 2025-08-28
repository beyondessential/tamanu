import config from 'config';

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

  async run() {
    try {
      const {
        settings,
        store: { models },
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
        const reportData = await latestVersion.dataGenerator(this.context, {});

        // TODO: Send this to DHIS2 in TAN-2540
        log.info(`Report ${reportId} CSV Data: ${JSON.stringify(reportData)}`);
      }

      log.info('DHIS2 integration processing completed');
    } catch (error) {
      log.error('Error in DHIS2 integration processing', { error: error.message });
      throw error;
    }
  }
}
