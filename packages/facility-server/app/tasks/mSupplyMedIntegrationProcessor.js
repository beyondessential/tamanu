import config from 'config';
import { fetch } from 'undici';
import { Op } from 'sequelize';

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
    this.models = context.models;
  }

  async createLog() {
    // TODO: Implement logging to the database
  }

  async postRequest({ bodyJson }) {
    const { host, backoff } = await this.context.settings.get('integrations.mSupplyMed');
    const authToken = 'Bearer 1234567890';

    try {
      const response = await fetchWithRetryBackoff(
        `${host}/tamanu-dispense-medication`,
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

    const lastSuccessfulPush = await this.models.MSupplyPushLog.findOne({
      where: {
        status: 'success',
      },
      order: [['created_at', 'DESC']],
    });
    const lastSuccessfulPushTimestamp = lastSuccessfulPush?.max_created_at || new Date(0);

    const medications = await this.models.MedicationDispense.findAll({
      where: {
        createdAt: {
          [Op.gt]: lastSuccessfulPushTimestamp,
        },
      },
    });

    log.info(`Sending ${medications.length} dispensed medications to mSupplyMed`);

    const body = {
      customerFilter: { /* actual name filter from current graphql schema*/ },
      items: medications.map(medication => ({
        itemFilter: { /* actual item filter from current graphql schema*/ },
        quantity: medication.quantity,
      })),
    };
    try {
      await this.postRequest({ bodyJson: JSON.stringify(body) });
    } catch (error) {
      log.error('Error sending dispensed medications to mSupplyMed', {
        error,
      });
    }
  }
}
