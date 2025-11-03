import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { ModelExporter } from './ModelExporter';

// - First column: invoiceProductId
// - Subsequent columns: one per InvoiceInsuranceContract.code
// - Cell values: coverageValue for that product in that contract, blank if none
export class InvoiceInsuranceContractItemExporter extends ModelExporter {
  constructor(context, dataType) {
    super(context, dataType);
    this._contractCodes = [];
  }

  async getData() {
    // Fetch all insurance contracts to determine columns (codes)
    const contracts = await this.models.InvoiceInsuranceContract.findAll({
      attributes: ['id', 'code'],
      where: {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        deletedAt: null,
      },
    });

    // Fetch all products
    const products = await this.models.InvoiceProduct.findAll({
      attributes: ['id'],
      where: {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        deletedAt: null,
      },
    });

    // If there are no contracts, return all products with just their IDs
    if (contracts.length === 0) {
      return products.map(product => ({ invoiceProductId: product.id }));
    }

    const contractCodesById = new Map(contracts.map(c => [c.id, c.code]));
    this._contractCodes = contracts.map(c => c.code).sort();

    // Fetch all contract items (coverage per product per contract)
    const items = await this.models.InvoiceInsuranceContractItem.findAll({
      attributes: ['invoiceInsuranceContractId', 'invoiceProductId', 'coverageValue'],
    });

    // Build rows keyed by invoiceProductId
    const rowsByProduct = new Map();
    for (const product of products) {
      rowsByProduct.set(product.id, { invoiceProductId: product.id });
    }

    // Populate coverage values for products
    for (const item of items) {
      const { invoiceProductId, invoiceInsuranceContractId, coverageValue } = item;
      const code = contractCodesById.get(invoiceInsuranceContractId);

      // Safety: skip items for contracts missing a code
      if (!code) {
        continue;
      }

      const row = rowsByProduct.get(invoiceProductId);
      if (row) {
        // Use raw numeric/decimal value as-is; importer coerces via Number()
        row[code] = coverageValue;
      }
    }

    // Return all products, including those without entries
    return [...rowsByProduct.values()];
  }

  getHeadersFromData() {
    return ['invoiceProductId', ...this._contractCodes];
  }

  customTabName() {
    return 'Invoice Insurance Items';
  }
}
