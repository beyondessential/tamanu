import { INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

const { HIDDEN, FIXED_CELL_PREFIX } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

export class InvoicePriceListItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'price',
      valueExtractor: item => {
        const { price, isHidden, isFixedPrice } = item;
        if (isHidden) return HIDDEN;
        if (isFixedPrice && price !== null && price !== undefined) {
          return `${FIXED_CELL_PREFIX}${price}`;
        }
        return price;
      },
      itemModelAttributes: ['isHidden', 'isFixedPrice'],
      tabName: 'Invoice Price List Items',
    });
  }
}
