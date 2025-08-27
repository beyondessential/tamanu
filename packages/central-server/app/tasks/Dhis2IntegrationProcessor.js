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

      // Get DHIS2 settings
      const { enabled, reportIds } = await this.context.settings.get('integrations.dhis2');

      if (!enabled) {
        log.debug('DHIS2 integration is disabled, skipping processing');
        return;
      }

      log.info(`Processing DHIS2 integration for ${reportIds.length} reports`);

      for (const reportId of reportIds) {
        const report = await this.context.store.models.ReportDefinition.findByPk(reportId, {
          include: [{ model: this.context.store.models.ReportDefinitionVersion, as: 'versions' }],
        });

        log.info('Processing report', { reportId, report });

        const reportVersion = getLatestVersion(report.versions, REPORT_STATUSES.PUBLISHED);

        const reportData = await reportVersion.dataGenerator(this.context, {});

        // TODO: Send this to DHIS2
        log.info(`Report ${reportId} data: ${JSON.stringify(reportData)}`);
      }

      log.debug('DHIS2 integration processing completed');
    } catch (error) {
      log.error('Error in DHIS2 integration processing', { error: error.message });
      throw error;
    }
  }
}
