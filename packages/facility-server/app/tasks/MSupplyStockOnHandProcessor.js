import config from 'config';

import { REFERENCE_TYPES, DRUG_STOCK_STATUSES } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';

import { MSupplyClient } from '../utils/MSupplyClient';

const STOCK_LINES_PAGE_SIZE = 500;

function getStockLinesQuery(storeId, first, offset) {
  return `
    query Stock {
      stockLines(storeId: "${storeId}", first: ${first}, offset: ${offset}) {
        ... on StockLineConnector {
          totalCount
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
    this.client = new MSupplyClient(context);
    this.serverFacilityIds = selectFacilityIds(config);
  }

  async fetchStockLines(host, storeId, authToken, backoff) {
    const allNodes = [];
    let offset = 0;
    let totalCount;

    do {
      const { data, errors } = await this.client.graphqlQuery({
        host,
        query: getStockLinesQuery(storeId, STOCK_LINES_PAGE_SIZE, offset),
        authToken,
        backoff,
      });

      if (errors?.length) {
        throw new Error(`mSupply stockLines query failed: ${errors[0].message}`);
      }

      const connector = data?.stockLines;
      const nodes = connector?.nodes ?? [];
      totalCount = connector?.totalCount ?? 0;
      allNodes.push(...nodes);

      if (nodes.length === 0) break;
      offset += nodes.length;
    } while (offset < totalCount);

    return allNodes;
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

    const matchingDrugs = await runFunctionInBatches(
      codes,
      batch =>
        this.models.ReferenceData.findAll({
          where: { code: batch, type: REFERENCE_TYPES.DRUG },
          include: [
            {
              model: this.models.ReferenceDrug,
              as: 'referenceDrug',
              required: true,
              attributes: ['id'],
            },
          ],
          attributes: ['id', 'code'],
        }),
      500,
    );

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
      await Promise.all(
        records.map(({ referenceDrugId, facilityId, quantity, stockStatus }) =>
          this.models.ReferenceDrugFacility.update(
            { quantity, stockStatus },
            { where: { referenceDrugId, facilityId } },
          ),
        ),
      );
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

    const { host, storeId, backoff } = await this.client.getSettings(facilityId);
    if (!host || !username || !password || !storeId) {
      log.warn('MSupplyStockOnHandProcessor: integration not fully configured, skipping');
      return;
    }

    const authToken = await this.client.authenticate(facilityId);
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
