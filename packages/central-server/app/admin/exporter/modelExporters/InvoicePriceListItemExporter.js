import { INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

const { MANUAL_ENTRY, HIDDEN } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

export class InvoicePriceListItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'price',
      valueExtractor: item => {
        const { price, visibilityStatus } = item;
        if (visibilityStatus === VISIBILITY_STATUSES.HISTORICAL) return HIDDEN;
        if (price === null) return MANUAL_ENTRY;
        return price;
      },
      itemModelAttributes: ['visibilityStatus'],
      tabName: 'Invoice Price List Items',
    });
  }
}
