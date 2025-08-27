import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { getLatestVersion } from '../subCommands/importReport/utils';

export class Dhis2IntegrationProcessor extends ScheduledTask {
  getName() {
    return 'Dhis2IntegrationProcessor';
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
      log.debug('Starting DHIS2 integration processing');

      const {
        settings,
        store: { models },
      } = this.context;

      // Get DHIS2 settings
      const { enabled, reportIds } = await settings.get('integrations.dhis2');

      if (!enabled) {
        log.debug('DHIS2 integration is disabled, skipping processing');
        return;
      }

      log.info(`Processing DHIS2 integration for ${reportIds.length} reports`);

      for (const reportId of reportIds) {
        const report = await models.ReportDefinition.findByPk(reportId, {
          include: [{ model: models.ReportDefinitionVersion, as: 'versions' }],
        });

        if (!report) {
          log.warn(`Report ${reportId} doesn't exist, skipping`);
          continue;
        }

        log.info('Processing report', { reportId });

        const reportVersion = getLatestVersion(report.versions, REPORT_STATUSES.PUBLISHED);

        if (!reportVersion) {
          log.warn(`Report ${reportId} has no published version, skipping`);
          continue;
        }

        const reportData = await reportVersion.dataGenerator(this.context, {});

        // TODO: Send this to DHIS2 in TAN-2540
        log.info(`Report ${reportId} CSV Data: ${JSON.stringify(reportData)}`);
      }

      log.debug('DHIS2 integration processing completed');
    } catch (error) {
      log.error('Error in DHIS2 integration processing', { error: error.message });
      throw error;
    }
  }
}
