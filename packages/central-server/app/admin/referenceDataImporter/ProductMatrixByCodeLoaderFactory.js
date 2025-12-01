import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generic, stateful loader factory for product-by-code matrix imports.
 *
 * Expected sheet shape:
 * - First column header (case-insensitive) is `invoiceProductId`.
 * - Remaining headers are parent codes (e.g., price list codes, insurance contract codes).
 * - Each row provides numeric values for product/code pairs.
 */
export function productMatrixByCodeLoaderFactory(config) {
  const { parentModel, itemModel, parentIdField, valueField, messages } = config;

  const state = {
    initialized: false,
    invoiceProductKey: null,
    codes: [],
    parentIdCache: new Map(),
  };

  return async (rawItem, { pushError, models }) => {
    // Normalize keys (trim)
    const item = Object.fromEntries(
      Object.entries(rawItem).map(([k, v]) => [k?.trim?.() ?? k, v]),
    );

    if (!state.initialized) {
      const headers = Object.keys(item);
      const invoiceProductKey = headers.find(h => h.toLowerCase() === 'invoiceproductid');
      if (!invoiceProductKey) {
        pushError('Missing required column: invoiceProductId', itemModel);
        return [];
      }

      const codes = headers.filter(h => h !== invoiceProductKey);
      state.invoiceProductKey = invoiceProductKey;
      state.codes = codes;

      // Validate all parents exist and cache their IDs
      const existingParents = await models[parentModel].findAll({
        where: { code: { [Op.in]: codes } },
      });

      const seen = new Set();
      for (const code of codes) {
        if (seen.has(code)) {
          pushError(messages.duplicateCode(code), itemModel);
          continue;
        }
        seen.add(code);

        const parent = existingParents.find(p => p.code === code);
        if (!parent) {
          pushError(messages.missingParentByCode(code), itemModel);
          continue;
        }
        state.parentIdCache.set(code, parent.id);
      }

      // eslint-disable-next-line require-atomic-updates
      state.initialized = true;
    }

    const invoiceProductId = item[state.invoiceProductKey];
    if (!invoiceProductId) return [];

    // Validate product exists
    const productExists = await models.InvoiceProduct.findByPk(invoiceProductId);
    if (!productExists) {
      pushError(`Invoice product '${invoiceProductId}' does not exist`, itemModel);
      return [];
    }

    // Fetch existing items for this product to reuse ids
    const existingItems = await models[itemModel].findAll({ where: { invoiceProductId } });
    const existingItemsMap = new Map(
      existingItems.map(row => [`${row[parentIdField]}:${row.invoiceProductId}`, row.id]),
    );

    const rows = [];
    for (const code of state.codes) {
      const rawValue = item[code];
      // Skip empties
      if (rawValue === undefined || rawValue === null || `${rawValue}`.trim() === '') continue;

      const numericValue = Number(rawValue);
      if (Number.isNaN(numericValue)) {
        pushError(messages.invalidValue(rawValue, code, invoiceProductId), itemModel);
        return [];
      }

      const parentId = state.parentIdCache.get(code);
      if (!parentId) {
        pushError(messages.couldNotFindParentId(code), itemModel);
        return [];
      }

      const key = `${parentId}:${invoiceProductId}`;
      const id = existingItemsMap.get(key) || uuidv4();

      rows.push({
        model: itemModel,
        values: {
          id,
          [parentIdField]: parentId,
          invoiceProductId,
          [valueField]: numericValue,
        },
      });
    }

    return rows;
  };
}
