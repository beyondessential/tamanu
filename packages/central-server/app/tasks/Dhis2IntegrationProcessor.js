import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

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

  async process() {
    try {
      log.debug('Starting DHIS2 integration processing');

      // Get DHIS2 settings
      const dhis2Settings = await this.context.settings.get('integrations.dhis2');

      if (!dhis2Settings.enabled) {
        log.debug('DHIS2 integration is disabled, skipping processing');
        return;
      }

      const { reportIds } = dhis2Settings;
      log.info(`Processing DHIS2 integration for ${reportIds.length} reports`);

      // TODO: Implement actual DHIS2 integration logic here
      // This could include:
      // - Fetching report data
      // - Sending data to DHIS2
      // - Updating sync status
      // - Error handling and retries

      log.debug('DHIS2 integration processing completed');
    } catch (error) {
      log.error('Error in DHIS2 integration processing', { error: error.message });
      throw error;
    }
  }
}
