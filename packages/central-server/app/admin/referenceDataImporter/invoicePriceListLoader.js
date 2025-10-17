import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initializes or retrieves existing price list records based on their codes.
 * Checks for duplicate codes and creates a mapping from code to price list ID.
 */
async function initializePriceLists(priceListCodes, models, state, pushError) {
  const trimmedCodes = priceListCodes.map(c => c.trim());
  const seen = new Set();
  const priceListRows = [];

  const existingPriceLists = await models.InvoicePriceList.findAll({
    where: { code: { [Op.in]: trimmedCodes } },
  });
  const existingByCode = new Map(existingPriceLists.map(pl => [pl.code, pl.id]));

  for (const code of priceListCodes) {
    const trimmedCode = code.trim();
    if (seen.has(trimmedCode)) {
      pushError(`duplicate price list code: ${trimmedCode}`);
      continue;
    }
    seen.add(trimmedCode);

    const id = existingByCode.get(trimmedCode) || uuidv4();
    state.priceListIdCache.set(code, id);
    priceListRows.push({ model: 'InvoicePriceList', values: { id, code: trimmedCode } });
  }

  return priceListRows;
}

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
    pushError(`Invoice product '${invoiceProductId}' does not exist`);
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
  const rows = [];
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
      );
      return [];
    }

    const invoicePriceListId = state.priceListIdCache.get(code);
    if (!invoicePriceListId) {
      pushError(`Could not find InvoicePriceList ID for code '${code}'`);
      return [];
    }

    const itemKey = `${invoicePriceListId}:${invoiceProductId}`;
    const id = existingItemsMap.get(itemKey) || uuidv4();

    rows.push({
      model: 'InvoicePriceListItem',
      values: { id, invoicePriceListId, invoiceProductId, price },
    });
  }

  return rows;
}

/**
 * Factory function that creates a stateful loader for invoice price list imports.
 * The loader maintains state across rows to track price lists and codes.
 */
export function invoicePriceListLoader() {
  const state = {
    initialized: false,
    invoiceProductKey: null,
    priceListCodes: [],
    priceListIdCache: new Map(),
  };

  /**
   * Main loader function that processes each row of invoice price list import data.
   * On first call (initialization), extracts price list codes from headers and creates price lists.
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
      state.initialized = true;

      const priceListRows = await initializePriceLists(priceListCodes, models, state, pushError);
      const itemRows = await processRow(item, state, { pushError, models });

      return [...priceListRows, ...itemRows];
    }

    return processRow(item, state, { pushError, models });
  };
}
