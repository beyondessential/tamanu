import config from 'config';
import { fetch } from 'undici';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { InvalidConfigError } from '@tamanu/shared/errors';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

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
    this.serverFacilityIds = selectFacilityIds(config);
  }

  async createLog(values) {
    await this.models.MSupplyPushLog.create(values);
  }

  async postRequest(
    { bodyJson },
    { minMedicationCreatedAt, maxMedicationCreatedAt, maxMedicationId, serverFacilityId },
  ) {
    const { host, backoff } =
      await this.context.settings[serverFacilityId].get('integrations.mSupplyMed');
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

      const { success, message } = await response.json();

      if (success) {
        await this.createLog({
          minMedicationCreatedAt,
          maxMedicationCreatedAt,
          maxMedicationId,
          status: 'success',
          message,
        });
      } else {
        throw new Error(message);
      }
    } catch (error) {
      await this.createLog({
        minMedicationCreatedAt,
        maxMedicationCreatedAt,
        maxMedicationId,
        status: 'failed',
        message: error.message,
      });
      throw error;
    }
  }

  async getBaseQuery() {
    const lastSuccessfulPush = await this.models.MSupplyPushLog.findOne({
      where: {
        status: 'success',
      },
      order: [['createdAt', 'DESC']],
    });

    // Process everything if there is no successful push
    if (!lastSuccessfulPush) {
      return {};
    }

    const { maxMedicationCreatedAt, maxMedicationId } = lastSuccessfulPush;

    return {
      where: {
        [Op.or]: [
          // Case 1: Newer timestamps
          {
            createdAt: {
              [Op.gt]: maxMedicationCreatedAt,
            },
          },
          // Case 2: Exact same timestamp, newer ID
          {
            createdAt: maxMedicationCreatedAt,
            id: {
              [Op.gt]: maxMedicationId,
            },
          },
        ],
      },
    };
  }

  async run() {
    // Ensure this facility is not an omni server
    if (this.serverFacilityIds.length > 1) {
      log.warn('This facility is an omni server, skipping mSupplyMedIntegrationProcessor');
      return;
    }

    const { host } =
      (await this.context.settings[this.serverFacilityIds[0]]?.get('integrations.mSupplyMed')) ??
      {};
    const { enabled, username, password } = config.integrations.mSupplyMed;
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.config;

    if (!enabled || !host || !username || !password) {
      log.warn('Integration for mSupplyMedIntegrationProcessor not configured, skipping');
      return;
    }

    // TODO: fine tune these values
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for mSupplyMedIntegrationProcessor',
      );
    }

    const baseQuery = await this.getBaseQuery();
    const toProcess = await this.models.MedicationDispense.count(baseQuery);
    if (toProcess === 0) return;

    const batchCount = Math.ceil(toProcess / batchSize);

    for (let i = 0; i < batchCount; i++) {
      const medications = await this.models.MedicationDispense.findAll({
        ...baseQuery,
        order: [['createdAt', 'ASC'], ['id', 'ASC']],
        limit: batchSize,
        offset: i * batchSize,
      });

      // Ensure we have at least one dispensed medication to process,
      // even though we already counted them, this could happen if they
      // were deleted between batch count and query.
      if (medications.length === 0) break;

      const minMedicationCreatedAt = medications[0].createdAt;
      const maxMedicationCreatedAt = medications[medications.length - 1].createdAt;
      const maxMedicationId = medications[medications.length - 1].id;

      log.info(`Sending ${medications.length} dispensed medications to mSupply`, {
        minMedicationCreatedAt,
        maxMedicationCreatedAt,
      });

      const body = {
        customerFilter: {
          /* actual name filter from current graphql schema*/
        },
        items: medications.map(medication => ({
          itemFilter: {
            /* actual item filter from current graphql schema*/
          },
          quantity: medication.quantity,
        })),
      };
      try {
        await this.postRequest(
          {
            bodyJson: JSON.stringify(body),
          },
          {
            minMedicationCreatedAt,
            maxMedicationCreatedAt,
            maxMedicationId,
            serverFacilityId: this.serverFacilityIds[0],
          },
        );
      } catch (error) {
        log.error('Error sending dispensed medications to mSupplyMed', {
          error,
        });

        // If the request fails, break out of the loop
        // This will prevent us from sending the same medications multiple times
        // If the request fails, we will retry in the next batch
        break;
      }

      if (i < batchCount - 1) {
        await sleepAsync(batchSleepAsyncDurationInMilliseconds);
      }
    }
  }
}
