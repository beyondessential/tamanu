import { QueryTypes } from 'sequelize';
import { REFERENCE_TYPES, DRUG_STOCK_STATUSES } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { runFunctionInBatches } from '@tamanu/utils/runFunctionInBatches';

import { MSupplyClient } from '../utils/MSupplyClient';
import { getServerFacilityIds } from '../serverConfig';

// The most items mSupply returns in one page
export const ITEMS_PAGE_SIZE = 5000;

// Sourced from items rather than stockLines: an item never stocked in the store
// has no stock lines, so stockLines leaves it out, while items reports it with
// an availableStockOnHand of 0.
//
// No sort is passed on purpose. Without one, mSupply orders items by id, the only
// unique order it offers, so items sharing a code can't shift between pages.
const ITEMS_STOCK_ON_HAND_QUERY = `
  query ItemsStockOnHand($storeId: String!, $page: PaginationInput) {
    items(storeId: $storeId, page: $page) {
      ... on ItemConnector {
        totalCount
        nodes {
          code
          availableStockOnHand(storeId: $storeId)
        }
      }
    }
  }
`;

function computeStockStatus(totalQuantity) {
  if (totalQuantity > 0) return DRUG_STOCK_STATUSES.IN_STOCK;
  return DRUG_STOCK_STATUSES.OUT_OF_STOCK;
}

export class MSupplyStockOnHandProcessor extends ScheduledTask {
  getName() {
    return 'MSupplyStockOnHandProcessor';
  }

  constructor(context) {
    const conf = context.schedules.mSupplyStockOnHandProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
    this.models = context.models;
    this.client = new MSupplyClient(context);
  }

  async fetchItemsPage({ host, storeId, authToken, backoff, offset }) {
    const { data, errors } = await this.client.graphqlQuery({
      host,
      query: ITEMS_STOCK_ON_HAND_QUERY,
      variables: { storeId, page: { first: ITEMS_PAGE_SIZE, offset } },
      authToken,
      backoff,
    });

    if (errors?.length) {
      throw new Error(`mSupply items query failed: ${errors[0].message}`);
    }

    return data.items;
  }

  async fetchItems(host, storeId, authToken, backoff) {
    const items = [];
    for (;;) {
      const { nodes, totalCount } = await this.fetchItemsPage({
        host,
        storeId,
        authToken,
        backoff,
        offset: items.length,
      });
      items.push(...nodes);
      // An empty page ends it too, so a totalCount never delivered can't loop forever
      if (nodes.length === 0 || items.length >= totalCount) return items;
    }
  }

  // mSupply can hold more than one item with the same code
  aggregateStockByCode(items) {
    const aggregated = new Map();

    for (const { code, availableStockOnHand } of items) {
      if (!code) continue;

      const current = aggregated.get(code) ?? 0;
      aggregated.set(code, current + availableStockOnHand);
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
    if (matchingDrugs.length === 0) return { updated: 0, skipped };

    const quantities = matchingDrugs.map(drug => stockByCode.get(drug.code));

    // One statement for every drug, writing only rows whose stock has changed,
    // so an unchanged drug adds nothing to the changelog
    const updated = await this.context.sequelize.query(
      `
        UPDATE reference_drug_facilities
        SET quantity = stock.quantity, stock_status = stock.stock_status
        FROM unnest(
          ARRAY[:referenceDrugIds]::uuid[],
          ARRAY[:quantities]::integer[],
          ARRAY[:stockStatuses]::text[]
        ) AS stock (reference_drug_id, quantity, stock_status)
        WHERE reference_drug_facilities.reference_drug_id = stock.reference_drug_id
          AND reference_drug_facilities.facility_id = :facilityId
          AND reference_drug_facilities.deleted_at IS NULL
          AND (
            reference_drug_facilities.quantity IS DISTINCT FROM stock.quantity
            OR reference_drug_facilities.stock_status IS DISTINCT FROM stock.stock_status
          )
      `,
      {
        replacements: {
          referenceDrugIds: matchingDrugs.map(drug => drug.referenceDrug.id),
          quantities,
          stockStatuses: quantities.map(computeStockStatus),
          facilityId,
        },
        type: QueryTypes.BULKUPDATE,
      },
    );

    return { updated, skipped };
  }

  async run() {
    // Read at run time, not construction — tasks may start before first-run
    // setup has configured the facility ids.
    const serverFacilityIds = getServerFacilityIds() ?? [];
    if (serverFacilityIds.length === 0) {
      log.warn('MSupplyStockOnHandProcessor: no facility configured yet, skipping');
      return;
    }
    if (serverFacilityIds.length > 1) {
      log.warn('MSupplyStockOnHandProcessor: omni server detected, skipping');
      return;
    }
    const [facilityId] = serverFacilityIds;

    const { stockOnHandEnabled, username, password, host, storeId, backoff } =
      await this.client.getSettings(facilityId);

    if (!stockOnHandEnabled) {
      log.warn('MSupplyStockOnHandProcessor: stock on hand sync is disabled, skipping');
      return;
    }

    if (!host || !username || !password || !storeId) {
      log.warn('MSupplyStockOnHandProcessor: integration not fully configured, skipping');
      return;
    }

    const authToken = await this.client.authenticate(facilityId);
    const items = await this.fetchItems(host, storeId, authToken, backoff);

    log.info('MSupplyStockOnHandProcessor: received items from mSupply', {
      totalItems: items.length,
    });

    const stockByCode = this.aggregateStockByCode(items);

    log.info('MSupplyStockOnHandProcessor: aggregated stock by item code', {
      uniqueMedications: stockByCode.size,
    });

    const { updated, skipped } = await this.updateStockForFacility(stockByCode, facilityId);

    log.info('MSupplyStockOnHandProcessor: stock on hand update complete', {
      updated,
      skippedNoMatch: skipped,
    });
  }
}
