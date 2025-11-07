import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Processes a single data row by validating prices and building price list items.
 * Validates prices for each price list code, then creates price list item records.
 */
async function processRow(item, state, { pushError, models }) {
  const invoiceProductId = item[state.invoiceProductKey];
  if (!invoiceProductId) return [];

  // Validate that the invoice product exists
  const productExists = await models.InvoiceProduct.findByPk(invoiceProductId);
  if (!productExists) {
    pushError(`Invoice product '${invoiceProductId}' does not exist`, 'InvoicePriceListItem');
    return [];
  }

  // Fetch existing items for this product
  const existingItems = await models.InvoicePriceListItem.findAll({
    where: { invoiceProductId },
  });
  const existingItemsMap = new Map(
    existingItems.map(item => [`${item.invoicePriceListId}:${item.invoiceProductId}`, item.id]),
  );

  // Validate prices and build price list items
  const items = [];
  for (const code of state.priceListCodes) {
    const rawPrice = item[code];

    // Skip empty values (treat as null)
    if (rawPrice === undefined || rawPrice === null || `${rawPrice}`.trim() === '') {
      continue;
    }

    // Validate numeric price
    const price = Number(rawPrice);
    if (Number.isNaN(price)) {
      pushError(
        `Invalid price value '${rawPrice}' for priceList '${code}' and invoiceProductId '${invoiceProductId}'`,
        'InvoicePriceListItem',
      );
      return [];
    }

    const invoicePriceListId = state.priceListIdCache.get(code);
    if (!invoicePriceListId) {
      pushError(`Could not find InvoicePriceList ID for code '${code}'`, 'InvoicePriceListItem');
      return [];
    }

    const itemKey = `${invoicePriceListId}:${invoiceProductId}`;
    const id = existingItemsMap.get(itemKey) || uuidv4();

    items.push({
      model: 'InvoicePriceListItem',
      values: { id, invoicePriceListId, invoiceProductId, price },
    });
  }

  return items;
}

/**
 * Factory function that creates a stateful loader for invoice price list imports.
 * The loader maintains state across rows to track price lists and codes.
 */
export function invoicePriceListItemLoaderFactory() {
  const state = {
    initialized: false,
    invoiceProductKey: null,
    priceListCodes: [],
    priceListIdCache: new Map(),
  };

  /**
   * Main loader function that processes each row of invoice price list import data.
   * On first call (initialization), extracts price list codes from headers and validates they exist.
   * On subsequent calls, processes each row to create/update price list items for products.
   */
  return async (rawItem, { pushError, models }) => {
    // Normalize Item Keys
    const item = Object.fromEntries(Object.entries(rawItem).map(([k, v]) => [k?.trim?.() ?? k, v]));

    if (!state.initialized) {
      const headers = Object.keys(item);
      const invoiceProductKey = headers.find(h => h.toLowerCase() === 'invoiceproductid');

      if (!invoiceProductKey) {
        pushError('Missing required column: invoiceProductId');
        return [];
      }

      const priceListCodes = headers.filter(h => h !== invoiceProductKey);
      state.invoiceProductKey = invoiceProductKey;
      state.priceListCodes = priceListCodes;

      // Validate all price lists exist and cache their IDs
      const existingPriceLists = await models.InvoicePriceList.findAll({
        where: { code: { [Op.in]: priceListCodes } },
      });

      const seen = new Set();
      for (const code of priceListCodes) {
        if (seen.has(code)) {
          pushError(`duplicate price list code: ${code}`);
          continue;
        }
        seen.add(code);

        const priceList = existingPriceLists.find(pl => pl.code === code);
        if (!priceList) {
          pushError(`InvoicePriceList with code '${code}' does not exist`);
          continue;
        }
        state.priceListIdCache.set(code, priceList.id);
      }

      // eslint-disable-next-line require-atomic-updates
      state.initialized = true;
    }

    return processRow(item, state, { pushError, models });
  };
}
