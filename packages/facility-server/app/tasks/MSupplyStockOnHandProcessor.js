import config from 'config';
import { fetch } from 'undici';

import { REFERENCE_TYPES, DRUG_STOCK_STATUSES } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

const GRAPHQL_ENDPOINT = '/graphql';

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

function getStockLinesQuery(storeId) {
  return `
    query Stock {
      stockLines(storeId: "${storeId}") {
        ... on StockLineConnector {
          nodes {
            id
            item {
              universalCode
            }
            availableNumberOfPacks
            totalNumberOfPacks
            packSize
          }
        }
      }
    }
  `;
}

function computeStockStatus(totalQuantity) {
  if (totalQuantity > 0) return DRUG_STOCK_STATUSES.IN_STOCK;
  return DRUG_STOCK_STATUSES.OUT_OF_STOCK;
}

export class MSupplyStockOnHandProcessor extends ScheduledTask {
  getName() {
    return 'MSupplyStockOnHandProcessor';
  }

  constructor(context) {
    const conf = config.schedules.MSupplyStockOnHandProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.models;
    this.serverFacilityIds = selectFacilityIds(config);
  }

  async getSettings(facilityId) {
    const integrationSettings = await this.context.settings[facilityId]?.get(
      'integrations.mSupplyMed',
    );
    return integrationSettings ?? {};
  }

  async getAuthToken(facilityId) {
    const { host, backoff } = await this.getSettings(facilityId);
    const { username, password } = config.integrations.mSupplyMed;

    const response = await fetchWithRetryBackoff(
      `${host}${GRAPHQL_ENDPOINT}`,
      {
        fetch,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: AUTH_QUERY, variables: { username, password } }),
      },
      { ...backoff, log },
    );

    const { data } = await response.json();
    const token = data?.authToken?.token;
    if (!token) {
      throw new Error('mSupply authentication failed: no token returned');
    }
    return token;
  }

  async fetchStockLines(host, storeId, authToken, backoff) {
    const response = await fetchWithRetryBackoff(
      `${host}${GRAPHQL_ENDPOINT}`,
      {
        fetch,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ query: getStockLinesQuery(storeId) }),
      },
      { ...backoff, log },
    );

    const { data, errors } = await response.json();
    if (errors?.length) {
      throw new Error(`mSupply stockLines query failed: ${errors[0].message}`);
    }

    return data?.stockLines?.nodes ?? [];
  }

  aggregateStockByCode(stockLines) {
    const aggregated = new Map();

    for (const line of stockLines) {
      const universalCode = line.item?.universalCode;
      if (!universalCode) continue;

      const totalUnits = (line.availableNumberOfPacks ?? 0) * (line.packSize ?? 1);
      const current = aggregated.get(universalCode) ?? 0;
      aggregated.set(universalCode, current + totalUnits);
    }

    return aggregated;
  }

  async updateStockForFacility(stockByCode, facilityId) {
    const codes = [...stockByCode.keys()];
    if (codes.length === 0) return { updated: 0, skipped: 0 };

    const matchingDrugs = await this.models.ReferenceData.findAll({
      where: { code: codes, type: REFERENCE_TYPES.DRUG },
      include: [
        {
          model: this.models.ReferenceDrug,
          as: 'referenceDrug',
          required: true,
          attributes: ['id'],
        },
      ],
      attributes: ['id', 'code'],
    });

    const skipped = codes.length - matchingDrugs.length;

    const records = matchingDrugs.map(drug => {
      const quantity = stockByCode.get(drug.code);
      return {
        referenceDrugId: drug.referenceDrug.id,
        facilityId,
        quantity,
        stockStatus: computeStockStatus(quantity),
      };
    });

    if (records.length > 0) {
      await this.models.ReferenceDrugFacility.bulkCreate(records, {
        updateOnDuplicate: ['quantity', 'stockStatus'],
      });
    }

    return { updated: records.length, skipped };
  }

  async run() {
    const { enabled, username, password } = config.integrations.mSupplyMed;

    if (!enabled) {
      log.warn('MSupplyStockOnHandProcessor: mSupply integration is disabled, skipping');
      return;
    }

    if (this.serverFacilityIds.length > 1) {
      log.warn('MSupplyStockOnHandProcessor: omni server detected, skipping');
      return;
    }
    const [facilityId] = this.serverFacilityIds;

    const { host, storeId, backoff } = await this.getSettings(facilityId);
    if (!host || !username || !password || !storeId) {
      log.warn('MSupplyStockOnHandProcessor: integration not fully configured, skipping');
      return;
    }

    const authToken = await this.getAuthToken(facilityId);
    const stockLines = await this.fetchStockLines(host, storeId, authToken, backoff);

    log.info('MSupplyStockOnHandProcessor: received stock lines from mSupply', {
      totalLines: stockLines.length,
    });

    const stockByCode = this.aggregateStockByCode(stockLines);

    log.info('MSupplyStockOnHandProcessor: aggregated stock by universal code', {
      uniqueMedications: stockByCode.size,
    });

    const { updated, skipped } = await this.updateStockForFacility(stockByCode, facilityId);

    log.info('MSupplyStockOnHandProcessor: stock on hand update complete', {
      updated,
      skippedNoMatch: skipped,
    });
  }
}
