import { INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

const { HIDDEN } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

export class InvoicePriceListItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'price',
      valueExtractor: item => {
        const { price, isHidden } = item;
        if (isHidden) return HIDDEN;
        return price;
      },
      itemModelAttributes: ['isHidden'],
      tabName: 'Invoice Price List Items',
    });
  }
}
