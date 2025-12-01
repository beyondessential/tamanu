import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

export class InvoicePriceListItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'price',
      valueExtractor: item => {
        const { price, visibilityStatus } = item;
        if (visibilityStatus === VISIBILITY_STATUSES.HISTORICAL) return 'hidden';
        if (price === null) return 'manual-entry';
        return price;
      },
      tabName: 'Invoice Price List Items',
    });
  }
}
