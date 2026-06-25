import { INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

const { HIDDEN, FIXED_PREFIX } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

export class InvoicePriceListItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'price',
      // Emit per-cell markers (no `:fixed` header reconstruction) so a round-trip re-imports
      // identically: `hidden`, an `f`-prefixed fixed fee, or a plain per-unit price.
      valueExtractor: item => {
        const { price, isHidden, isFixedPrice } = item;
        if (isHidden) return HIDDEN;
        if (isFixedPrice && price !== null) return `${FIXED_PREFIX}${price}`;
        return price;
      },
      itemModelAttributes: ['isHidden', 'isFixedPrice'],
      tabName: 'Invoice Price List Items',
    });
  }
}
