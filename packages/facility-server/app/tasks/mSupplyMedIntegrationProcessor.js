import config from 'config';
import { fetch } from 'undici';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { InvalidConfigError } from '@tamanu/shared/errors';

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
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!enabled || !host || !username || !password) {
      log.warn('Integration for mSupplyMed not configured, skipping');
      return;
    }

    // TODO: fine tune these values
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for mSupplyMedIntegrationProcessor',
      );
    }

    const lastSuccessfulPush = await this.models.MSupplyPushLog.findOne({
      where: {
        status: 'success',
      },
      order: [['createdAt', 'DESC']],
    });
    const lastSuccessfulPushTimestamp = lastSuccessfulPush?.maxMedicationCreatedAt ?? new Date(0);

    const query = {
      where: {
        createdAt: {
          [Op.gt]: lastSuccessfulPushTimestamp,
        },
      },
    };

    const toProcess = await this.models.MedicationDispense.count(query);
    if (toProcess === 0) return;

    const batchCount = Math.ceil(toProcess / batchSize);

    for (let i = 0; i < batchCount; i++) {
      const medications = await this.models.MedicationDispense.findAll({
        ...query,
        order: [['createdAt', 'ASC']],
        limit: batchSize,
      });

      log.info(`Sending ${medications.length} dispensed medications to mSupply`);

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
}
