import config from 'config';
import { fetch } from 'undici';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { InvalidConfigError } from '@tamanu/shared/errors';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// INTEGRATION DETAILS
const INTEGRATION_PLUGIN_CODE = 'bes-plugins';
const INTEGRATION_ENDPOINT = '/graphql';

// GRAPHQL QUERIES
const AUTH_QUERY = `
  query Auth($password: String!, $username: String!) {
    authToken(password: $password, username: $username) {
      ... on AuthToken {
        __typename
        token
      }
      ... on AuthTokenError {
        __typename
        error {
          description
        }
      }
    }
  }
`;

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
    this.serverFacilityIds = selectFacilityIds(config);
    this.authHeader = null;
  }

  async createLog(values) {
    await this.models.MSupplyPushLog.create(values);
  }

  async getSettings(facilityId) {
    const integrationSettings = await this.context.settings[facilityId]?.get(
      'integrations.mSupplyMed',
    );
    return integrationSettings ?? {};
  }

  async getAuthHeader(facilityId) {
    const { host, backoff } = await this.getSettings(facilityId);
    const { username, password } = config.integrations.mSupplyMed;
    const variables = { username, password };

    try {
      const response = await fetchWithRetryBackoff(
        `${host}${INTEGRATION_ENDPOINT}`,
        {
          fetch,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ AUTH_QUERY, variables }),
        },
        { ...backoff, log },
      );

      const { data } = await response.json();
      const authToken = data?.authToken?.token;

      if (!authToken) {
        throw new Error('No auth token found');
      }

      return `Bearer ${authToken}`;
    } catch (error) {
      throw new Error('Authentication failed: ' + error.message);
    }
  }

  async postRequest(
    { bodyJson },
    { minMedicationCreatedAt, maxMedicationCreatedAt, minMedicationId, maxMedicationId, facilityId },
  ) {
    const { host, backoff, storeId } = await this.getSettings(facilityId);
    const postQuery = getPostQuery(storeId);
    const variables = { input: bodyJson };

    try {
      const response = await fetchWithRetryBackoff(
        `${host}${INTEGRATION_ENDPOINT}`,
        {
          fetch,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
          body: JSON.stringify({ query: postQuery, variables }),
        },
        { ...backoff, log },
      );

      const { success, message } = await response.json();

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
        throw new Error(message);
      }
    } catch (error) {
      await this.createLog({
        minMedicationCreatedAt,
        maxMedicationCreatedAt,
        minMedicationId,
        maxMedicationId,
        status: 'failed',
        message: error.message,
      });
      throw error;
    }
  }

  async getBaseQuery(facilityId) {
    const lastSuccessfulPush = await this.models.MSupplyPushLog.findOne({
      where: {
        status: 'success',
      },
      order: [['createdAt', 'DESC']],
    });

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

    // Process everything if there is no successful push
    if (!lastSuccessfulPush) {
      return { include };
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
      include,
    };
  }

  async run() {
    // Ensure this facility is not an omni server
    if (this.serverFacilityIds.length > 1) {
      log.warn('This facility is an omni server, skipping mSupplyMedIntegrationProcessor');
      return;
    }

    const [facilityId] = this.serverFacilityIds;
    const { host, storeId, customerId } = await this.getSettings(facilityId);
    const { enabled, username, password } = config.integrations.mSupplyMed;
    const { batchSize, batchSleepAsyncDurationInMilliseconds } = this.scheduleConfig;

    if (!enabled || !host || !username || !password || !storeId || !customerId) {
      log.warn('Integration for mSupplyMedIntegrationProcessor not configured, skipping');
      return;
    }

    if (!batchSize || !batchSleepAsyncDurationInMilliseconds) {
      throw new InvalidConfigError(
        'batchSize and batchSleepAsyncDurationInMilliseconds must be set for mSupplyMedIntegrationProcessor',
      );
    }

    const baseQuery = await this.getBaseQuery(facilityId);
    const toProcess = await this.models.MedicationDispense.count(baseQuery);
    if (toProcess === 0) return;

    // Log in and process the dispensed medications in batches
    this.authHeader = await this.getAuthHeader(facilityId);
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

      const body = {
        invoiceId: minMedicationId, // Identify batch by the first medication's id
        customerId,
        items: medications.map(medication => ({
          universalCode: medication.pharmacyOrderPrescription.prescription.medication.code,
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
            minMedicationId,
            maxMedicationId,
            facilityId,
          },
        );
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
