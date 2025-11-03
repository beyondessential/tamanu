import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

// - First column: invoiceProductId
// - Subsequent columns: one per InvoicePriceList.code
// - Cell values: price for that product in that price list, blank if none
export class InvoicePriceListItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'price',
      tabName: 'Invoice Price List Items',
    });
  }
}
