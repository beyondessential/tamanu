import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Processes a single data row by validating coverage values and building insurance contract items.
 * Validates coverage for each insurance contract code, then creates contract item records.
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
  const existingItems = await models.InvoiceInsuranceContractItem.findAll({
    where: { invoiceProductId },
  });
  const existingItemsMap = new Map(
    existingItems.map(item => [`${item.invoiceInsuranceContractId}:${item.invoiceProductId}`, item.id]),
  );

  // Validate coverage values and build insurance contract items
  const items = [];
  for (const code of state.contractCodes) {
    const rawCoverage = item[code];

    // Skip empty values (treat as null)
    if (rawCoverage === undefined || rawCoverage === null || `${rawCoverage}`.trim() === '') {
      continue;
    }

    // Validate numeric coverage
    const coverageValue = Number(rawCoverage);
    if (Number.isNaN(coverageValue)) {
      pushError(
        `Invalid coverage value '${rawCoverage}' for insuranceContract '${code}' and invoiceProductId '${invoiceProductId}'`,
      );
      return [];
    }

    const invoiceInsuranceContractId = state.contractIdCache.get(code);
    if (!invoiceInsuranceContractId) {
      pushError(`Could not find InvoiceInsuranceContract ID for code '${code}'`);
      return [];
    }

    const itemKey = `${invoiceInsuranceContractId}:${invoiceProductId}`;
    const id = existingItemsMap.get(itemKey) || uuidv4();

    items.push({
      model: 'InvoiceInsuranceContractItem',
      values: { id, invoiceInsuranceContractId, invoiceProductId, coverageValue },
    });
  }

  return items;
}

/**
 * Factory to create a stateful loader for invoice insurance contract items imports.
 * Mirrors the invoice price list items importer: first call initialises headers & caches ids.
 */
export function invoiceInsuranceContractItemLoaderFactory() {
  const state = {
    initialized: false,
    invoiceProductKey: null,
    contractCodes: [],
    contractIdCache: new Map(),
  };

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

      const contractCodes = headers.filter(h => h !== invoiceProductKey);
      state.invoiceProductKey = invoiceProductKey;
      state.contractCodes = contractCodes;

      // Validate all insurance contracts exist and cache their IDs
      const existingContracts = await models.InvoiceInsuranceContract.findAll({
        where: { code: { [Op.in]: contractCodes } },
      });

      const seen = new Set();
      for (const code of contractCodes) {
        if (seen.has(code)) {
          pushError(`duplicate insurance contract code: ${code}`);
          continue;
        }
        seen.add(code);

        const contract = existingContracts.find(c => c.code === code);
        if (!contract) {
          pushError(`InvoiceInsuranceContract with code '${code}' does not exist`);
          continue;
        }
        state.contractIdCache.set(code, contract.id);
      }

      // eslint-disable-next-line require-atomic-updates
      state.initialized = true;
    }

    return processRow(item, state, { pushError, models });
  };
}
