import config from 'config';
import { fetch } from 'undici';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

// Designed to post dispensed medications from pharmacy to an Open mSupply instance
export class mSupplyMedIntegrationProcessor extends ScheduledTask {
  getName() {
    return 'mSupplyMedIntegrationProcessor';
  }

  constructor(context) {
    const conf = config.schedules.mSupplyMedIntegrationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
  }

  async createLog() {
    // TODO: Implement logging to the database
  }

  async postRequest({ bodyJson }) {
    const { host, backoff } = await this.context.settings.get('integrations.mSupplyMed');
    const authToken = 'Bearer 1234567890';

    try {
      const response = await fetchWithRetryBackoff(
        `${host}/graphql`,
        {
          fetch,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authToken,
          },
          body: bodyJson,
        },
        { ...backoff, log },
      );

      return await response.json();
    } catch (error) {
      // TODO: pass appropriate arguments to createLog
      await this.createLog();
      throw error;
    }
  }

  async run() {
    const { host } = await this.context.settings.global.get('integrations.mSupplyMed');
    const { enabled, username, password } = config.integrations.mSupplyMed;

    if (!enabled || !host || !username || !password) {
      log.warn('Integration for mSupplyMed not configured, skipping');
      return;
    }

    // TODO: Implement query to get dispensed medications from the database
    const medications = [];
    log.info(`Sending ${medications.length} dispensed medications to mSupplyMed`);

    for (const medication of medications) {
      try {
        const body = {
          query: '',
          variables: {
            medicationId: medication.id,
            quantity: medication.quantity,
          },
        };
        await this.postRequest({ bodyJson: JSON.stringify(body) });
      } catch (error) {
        log.error('Error sending dispensed medication to mSupplyMed', {
          medicationId: medication.id,
          error,
        });
      }
    }
  }
}
