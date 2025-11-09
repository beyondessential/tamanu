import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { ModelExporter } from './ModelExporter';

/**
 * Generic exporter for a matrix shaped sheet:
 * - First column: invoiceProductId
 * - Subsequent columns: one per parent model code (e.g., price list code, contract code)
 * - Cell values: value field from the junction/item model for product x parent pair
 */
export class ProductMatrixByCodeExporter extends ModelExporter {
  constructor(context, dataType, config) {
    super(context, dataType);
    this._config = config;
    this._sortedCodes = [];
  }

  async getData() {
    const { parentModel, itemModel, parentIdField, valueField } = this._config;

    // Fetch all parents (to determine columns/codes)
    const parents = await this.models[parentModel].findAll({
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

    // If there are no parents, return products with only their ids
    if (parents.length === 0) {
      return products.map(p => ({ invoiceProductId: p.id }));
    }

    const codeByParentId = new Map(parents.map(p => [p.id, p.code]));
    this._sortedCodes = parents.map(p => p.code).sort();

    // Fetch all item rows for the matrix
    const items = await this.models[itemModel].findAll({
      attributes: [parentIdField, 'invoiceProductId', valueField],
    });

    // Prepare base rows by product
    const rowsByProduct = new Map();
    for (const product of products) {
      rowsByProduct.set(product.id, { invoiceProductId: product.id });
    }

    // Populate matrix values
    for (const item of items) {
      const parentId = item[parentIdField];
      const value = item[valueField];
      const productId = item.invoiceProductId;
      const code = codeByParentId.get(parentId);
      if (!code) continue; // safety: skip items for missing/hidden parents

      const row = rowsByProduct.get(productId);
      if (row) {
        row[code] = value; // keep raw value; importer will coerce as needed
      }
    }

    return [...rowsByProduct.values()];
  }

  getHeadersFromData() {
    return ['invoiceProductId', ...this._sortedCodes];
  }

  customTabName() {
    return this._config?.tabName || super.customTabName?.();
  }
}
