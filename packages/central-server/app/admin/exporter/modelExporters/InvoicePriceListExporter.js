import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { ModelExporter } from './ModelExporter';

// - First column: invoiceProductId
// - Subsequent columns: one per InvoicePriceList.code
// - Cell values: price for that product in that price list, blank if none
export class InvoicePriceListExporter extends ModelExporter {
  constructor(context, dataType) {
    super(context, dataType);
    this._priceListCodes = [];
  }

  async getData() {
    // Fetch all price lists to determine columns (codes)
    const priceLists = await this.models.InvoicePriceList.findAll({
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

    // If there are no price lists, return all products with just their IDs
    if (priceLists.length === 0) {
      return products.map(product => ({ invoiceProductId: product.id }));
    }

    const priceListCodesById = new Map(priceLists.map(pl => [pl.id, pl.code]));
    this._priceListCodes = priceLists.map(pl => pl.code).sort();

    // Fetch all price list items (prices per product per list)
    const items = await this.models.InvoicePriceListItem.findAll({
      attributes: ['invoicePriceListId', 'invoiceProductId', 'price'],
    });

    // Build rows keyed by invoiceProductId
    const rowsByProduct = new Map();
    for (const product of products) {
      rowsByProduct.set(product.id, { invoiceProductId: product.id });
    }

    // Populate prices for products
    for (const item of items) {
      const { invoiceProductId, invoicePriceListId, price } = item;
      const code = priceListCodesById.get(invoicePriceListId);

      // Safety: skip items for lists missing a code
      if (!code) {
        continue;
      }

      const row = rowsByProduct.get(invoiceProductId);
      if (row) {
        // Use raw numeric/decimal value as-is; importer coerces via Number()
        row[code] = price;
      }
    }

    // Return all products, including those without price entries
    return [...rowsByProduct.values()];
  }

  getHeadersFromData() {
    return ['invoiceProductId', ...this._priceListCodes];
  }

  customTabName() {
    return 'Invoice Price Lists';
  }
}
