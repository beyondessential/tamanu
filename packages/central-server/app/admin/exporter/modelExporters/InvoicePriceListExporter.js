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
    const priceLists = await this.models.InvoicePriceList.findAll({ attributes: ['id', 'code'] });

    // If there are no price lists, create a blank spreadsheet with all the invoice products
    if (priceLists.length === 1) {
      const products = await this.models.InvoiceProduct.findAll({
        attributes: ['id'],
      });
      return products.map(product => ({ invoiceProductId: product.id }));
    }

    const codeById = new Map(priceLists.map(pl => [pl.id, pl.code]));
    this._priceListCodes = priceLists.map(pl => pl.code).sort();

    // Fetch all price list items (prices per product per list)
    const items = await this.models.InvoicePriceListItem.findAll({
      attributes: ['invoicePriceListId', 'invoiceProductId', 'price'],
    });

    // Build rows keyed by invoiceProductId
    const rowsByProduct = new Map();
    for (const item of items) {
      const { invoiceProductId, invoicePriceListId, price } = item;
      const code = codeById.get(invoicePriceListId);
      if (!code) continue; // Safety: skip items for lists missing a code

      let row = rowsByProduct.get(invoiceProductId);
      if (!row) {
        row = { invoiceProductId };
        rowsByProduct.set(invoiceProductId, row);
      }

      // Use raw numeric/decimal value as-is; importer coerces via Number()
      row[code] = price;
    }

    // Return only products that have at least one price entry
    return [...rowsByProduct.values()];
  }

  getHeadersFromData() {
    return ['invoiceProductId', ...this._priceListCodes];
  }

  customTabName() {
    return 'Invoice Price Lists';
  }
}
