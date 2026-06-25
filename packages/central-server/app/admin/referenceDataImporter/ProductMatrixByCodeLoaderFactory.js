import { Op } from 'sequelize';

function defaultValueExtractor(value) {
  const parsedValue = Number(value);
  const isValidValue = !Number.isNaN(parsedValue);
  return { parsedValue, isValidValue };
}

// Each header maps to a single parent code with no extra per-column metadata.
function defaultHeaderResolver(rawHeader) {
  return [{ code: rawHeader, columnMeta: {} }];
}

/**
 * Generic, stateful loader factory for product-by-code matrix imports.
 *
 * Expected sheet shape:
 * - First column header (case-insensitive) is `invoiceProductId`.
 * - Remaining headers are parent codes (e.g., price list codes, insurance contract codes).
 * - Each row provides numeric values for product/code pairs.
 *
 * A `headerResolver` may return several candidate `{ code, columnMeta }` for a header in priority
 * order; the first candidate whose code matches an existing parent wins (so a literal header always
 * beats a token-stripped fallback). `columnMeta` is passed through to the `valueExtractor`.
 */
export function productMatrixByCodeLoaderFactory(config) {
  const {
    parentModel,
    itemModel,
    parentIdField,
    valueField,
    valueExtractor = defaultValueExtractor,
    headerResolver = defaultHeaderResolver,
    allowEmptyValues = false,
    messages,
  } = config;

  const state = {
    initialized: false,
    invoiceProductKey: null,
    columns: [],
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
      state.invoiceProductKey = invoiceProductKey;

      const codeHeaders = headers.filter(h => h !== invoiceProductKey);

      // Resolve candidate codes for every header, then look them all up at once.
      const candidatesByHeader = new Map();
      const allCandidateCodes = new Set();
      for (const header of codeHeaders) {
        const candidates = headerResolver(header);
        candidatesByHeader.set(header, candidates);
        candidates.forEach(candidate => allCandidateCodes.add(candidate.code));
      }

      const existingParents = await models[parentModel].findAll({
        where: { code: { [Op.in]: [...allCandidateCodes] } },
      });
      const parentIdByCode = new Map(existingParents.map(parent => [parent.code, parent.id]));

      const seenHeaders = new Set();
      const seenParentIds = new Set();
      for (const header of codeHeaders) {
        if (seenHeaders.has(header)) {
          pushError(messages.duplicateCode(header), itemModel);
          continue;
        }
        seenHeaders.add(header);

        // Code-first: the first candidate whose code exists wins.
        const match = candidatesByHeader
          .get(header)
          .find(candidate => parentIdByCode.has(candidate.code));
        if (!match) {
          pushError(messages.missingParentByCode(header), itemModel);
          continue;
        }

        const parentId = parentIdByCode.get(match.code);
        // Two different headers can resolve to the same parent (e.g. `KOSRAE` and `KOSRAE:fixed`).
        if (seenParentIds.has(parentId)) {
          pushError(messages.duplicateCode(header), itemModel);
          continue;
        }
        seenParentIds.add(parentId);

        state.columns.push({ header, parentId, columnMeta: match.columnMeta });
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
    for (const { header, parentId, columnMeta } of state.columns) {
      const rawValue = item[header];

      const isEmpty = rawValue === undefined || rawValue === null || `${rawValue}`.trim() === '';
      if (!allowEmptyValues && isEmpty) continue;

      const { parsedValue, isValidValue, errorMessage, ...otherColumns } = valueExtractor(
        rawValue,
        isEmpty,
        columnMeta,
        productExists,
      );
      if (!isValidValue) {
        pushError(errorMessage ?? messages.invalidValue(rawValue, header, invoiceProductId), itemModel);
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
