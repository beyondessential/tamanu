import { Op } from 'sequelize';

function defaultValueExtractor(value) {
  const parsedValue = Number(value);
  const isValidValue = !Number.isNaN(parsedValue);
  return { parsedValue, isValidValue };
}

function defaultHeaderParser(header) {
  return { code: header };
}

/**
 * Generic, stateful loader factory for product-by-code matrix imports.
 *
 * Expected sheet shape:
 * - First column header (case-insensitive) is `invoiceProductId`.
 * - Remaining headers are parent codes (e.g., price list codes, insurance contract codes).
 * - Each row provides numeric values for product/code pairs.
 */
export function productMatrixByCodeLoaderFactory(config) {
  const {
    parentModel,
    itemModel,
    parentIdField,
    valueField,
    valueExtractor = defaultValueExtractor,
    headerParser = defaultHeaderParser,
    allowEmptyValues = false,
    messages,
  } = config;

  const state = {
    initialized: false,
    invoiceProductKey: null,
    headers: [],
    parentIdCache: new Map(),
    headerMetaByHeader: new Map(),
  };

  return async (rawItem, { pushError, models, header: sheetHeader }) => {
    // Normalize keys (trim)
    const item = Object.fromEntries(Object.entries(rawItem).map(([k, v]) => [k?.trim?.() ?? k, v]));

    if (!state.initialized) {
      // Use sheet header when available so we get all columns even if the first data row has empty cells
      // Note: Excel may parse number-like headers as numbers, so we coerce to string.
      // Map null/undefined to empty string to avoid literal "null"/"undefined" in headers.
      const rawHeaders = Array.isArray(sheetHeader)
        ? sheetHeader.map(h => (h == null ? '' : String(h).trim()))
        : Object.keys(item);
      const headers = rawHeaders.filter(Boolean);
      const invoiceProductKey = headers.find(h => h.toLowerCase() === 'invoiceproductid');
      if (!invoiceProductKey) {
        pushError('Missing required column: invoiceProductId', itemModel);
        return [];
      }

      const nonInvoiceProductHeaders = headers.filter(h => h !== invoiceProductKey);
      state.invoiceProductKey = invoiceProductKey;
      state.headers = nonInvoiceProductHeaders;

      // Parse each header into code + optional metadata
      const codes = [];
      for (const header of nonInvoiceProductHeaders) {
        const parsed = headerParser(header);
        state.headerMetaByHeader.set(header, parsed);
        codes.push(parsed.code);
      }

      // Validate all parents exist and cache their IDs
      const existingParents = await models[parentModel].findAll({
        where: { code: { [Op.in]: codes } },
      });

      const seen = new Set();
      for (let i = 0; i < nonInvoiceProductHeaders.length; i++) {
        const header = nonInvoiceProductHeaders[i];
        const code = codes[i];
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
        state.parentIdCache.set(header, parent.id);
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
    for (const header of state.headers) {
      const rawValue = item[header];
      const headerMeta = state.headerMetaByHeader.get(header) ?? { code: header };
      const code = headerMeta.code;

      const isEmpty = rawValue === undefined || rawValue === null || `${rawValue}`.trim() === '';
      if (!allowEmptyValues && isEmpty) continue;

      const { parsedValue, isValidValue, ...otherColumns } = valueExtractor(rawValue, {
        isEmpty,
        headerMeta,
      });
      if (!isValidValue) {
        pushError(messages.invalidValue(rawValue, code, invoiceProductId), itemModel);
        return [];
      }

      const parentId = state.parentIdCache.get(header);
      if (!parentId) {
        pushError(messages.couldNotFindParentId(code), itemModel);
        return [];
      }

      const key = `${parentId}:${invoiceProductId}`;
      const id = existingItemsMap.get(key) || crypto.randomUUID();

      rows.push({
        model: itemModel,
        values: {
          id,
          [parentIdField]: parentId,
          invoiceProductId,
          [valueField]: parsedValue,
          ...otherColumns,
        },
      });
    }

    return rows;
  };
}
