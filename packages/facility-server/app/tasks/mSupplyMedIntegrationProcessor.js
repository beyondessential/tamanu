import config from 'config';
import { Op } from 'sequelize';

import { FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT } from '@tamanu/constants/facts';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { MSupplyClient } from '../utils/MSupplyClient';

const INTEGRATION_PLUGIN_CODE = 'bes-plugins';

function getPostQuery(storeId) {
  return `
    query GraphqlPlugin($input: JSON!) {
      pluginGraphqlQuery(
        pluginCode: "${INTEGRATION_PLUGIN_CODE}"
        storeId: "${storeId}"
        input: $input
      )
    }
  `;
}

// Designed to post dispensed medications from pharmacy to an Open mSupply instance
export class mSupplyMedIntegrationProcessor extends ScheduledTask {
  getName() {
    return 'mSupplyMedIntegrationProcessor';
  }

  constructor(context) {
    const conf = config.schedules.mSupplyMedIntegrationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.scheduleConfig = conf;
    this.context = context;
    this.models = context.models;
    this.client = new MSupplyClient(context);
    this.serverFacilityIds = selectFacilityIds(config);
    this.authToken = null;
  }

  async createLog(values) {
    const { items, ...rest } = values;
    const hasItems = items && Array.isArray(items) && items.length > 0;
    const payload = { ...rest, ...(hasItems && { items }) };
    await this.models.MSupplyPushLog.create(payload);
  }

  async updateMSupplyStock(medications, facilityId) {
    const minMedicationId = medications[0].id;
    const minMedicationCreatedAt = medications[0].createdAt;
    const maxMedicationCreatedAt = medications[medications.length - 1].createdAt;
    const maxMedicationId = medications[medications.length - 1].id;

    log.info(`Sending ${medications.length} dispensed medications to mSupply`, {
      minMedicationId,
      minMedicationCreatedAt,
      maxMedicationCreatedAt,
      maxMedicationId,
    });

    const { host, backoff, storeId, customerCode } = await this.client.getSettings(facilityId);
    const variables = {
      input: {
        invoiceId: minMedicationId, // Identify batch by the first medication's id
        customerCode,
        items: medications.map(medication => ({
          itemCode: medication.pharmacyOrderPrescription.prescription.medication.code,
          numberOfUnits: medication.quantity,
        })),
      },
    };

    try {
      const { data } = await this.client.graphqlQuery({
        host,
        query: getPostQuery(storeId),
        variables,
        authToken: this.authToken,
        backoff,
      });
      const { success, message, items } = data?.pluginGraphqlQuery ?? {};

      if (success) {
        await this.createLog({
          minMedicationCreatedAt,
          maxMedicationCreatedAt,
          minMedicationId,
          maxMedicationId,
          status: 'success',
          message,
        });
      } else {
        const err = new Error(message);
        // Add items to the error for debugging
        err.items = items;
        throw err;
      }
    } catch (error) {
      await this.createLog({
        minMedicationCreatedAt,
        maxMedicationCreatedAt,
        minMedicationId,
        maxMedicationId,
        status: 'failed',
        message: error.message,
        items: error.items,
      });
      throw error;
    }
  }

  async getBaseQuery(facilityId, enabledAt) {
    const lastSuccessfulPush = await this.models.MSupplyPushLog.findOne({
      where: {
        status: 'success',
      },
      order: [['createdAt', 'DESC']],
    });

    const enabledAtCondition = {
      createdAt: {
        [Op.gte]: enabledAt,
      },
    };

    const include = [
      {
        model: this.models.PharmacyOrderPrescription,
        as: 'pharmacyOrderPrescription',
        required: true,
        include: [
          {
            model: this.models.Prescription,
            as: 'prescription',
            required: true,
            include: [
              {
                model: this.models.ReferenceData,
                as: 'medication',
                required: true,
              },
            ],
          },
          {
            model: this.models.PharmacyOrder,
            as: 'pharmacyOrder',
            required: true,
            include: [
              {
                model: this.models.Facility,
                as: 'facility',
                required: true,
                where: {
                  id: facilityId,
                },
              },
            ],
          },
        ],
      },
    ];

    // Process everything after enabledAt if there is no successful push
    if (!lastSuccessfulPush) {
      return {
        where: enabledAtCondition,
        include,
      };
    }

    const { maxMedicationCreatedAt, maxMedicationId } = lastSuccessfulPush;

    return {
      where: {
        [Op.and]: [
          enabledAtCondition,
          {
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
        ],
      },
      include,
    };
  }

  async getEnabledAt() {
    const enabledAt = await this.models.LocalSystemFact.get(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT);
    if (enabledAt) return enabledAt;

    const newEnabledAt = new Date().toISOString();
    await this.models.LocalSystemFact.set(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT, newEnabledAt);
    return newEnabledAt;
  }

  async run() {
    const { enabled, username, password } = config.integrations.mSupplyMed;

    // If the integration is disabled, delete the enabled-at fact and skip
    if (!enabled) {
      await this.models.LocalSystemFact.set(FACT_MSUPPLY_MED_INTEGRATION_ENABLED_AT, null);
      log.warn('mSupplyMedIntegrationProcessor is disabled, skipping');
      return;
    }

    // Get the enabled-at timestamp from the database or
    // set it to the current date if it doesn't exist
    const enabledAt = await this.getEnabledAt();

    // Ensure this facility is not an omni server
    if (this.serverFacilityIds.length > 1) {
      log.warn('This facility is an omni server, skipping mSupplyMedIntegrationProcessor');
      return;
    }
    const [facilityId] = this.serverFacilityIds;

    const { host, storeId, customerCode } = await this.client.getSettings(facilityId);
    if (!host || !username || !password || !storeId || !customerCode) {
      log.warn('Integration for mSupplyMedIntegrationProcessor not configured, skipping');
      return;
    }

    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.scheduleConfig;
    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new Error(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for mSupplyMedIntegrationProcessor',
      );
    }

    const baseQuery = await this.getBaseQuery(facilityId, enabledAt);
    const toProcess = await this.models.MedicationDispense.count(baseQuery);
    if (toProcess === 0) return;

    // Log in and process the dispensed medications in batches
    this.authToken = await this.client.authenticate(facilityId);
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

      try {
        await this.updateMSupplyStock(medications, facilityId);
      } catch (error) {
        log.error('Error sending dispensed medications to mSupplyMed', {
          error,
        });

        // If the request fails, we have to break out of the loop, otherwise we will
        // miss the medications that failed in this batch.
        break;
      }

      if (i < batchCount - 1) {
        await sleepAsync(batchSleepAsyncDurationInMilliseconds);
      }
    }
  }
}
