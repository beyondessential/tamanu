import { INVOICE_ITEMS_CATEGORIES, INVOICE_PRICE_LIST_CHARGING_VALUES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

const { FLAT_FEE, PER_UNIT } = INVOICE_PRICE_LIST_CHARGING_VALUES;

export class InvoicePriceListChargingExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'isFixedPrice',
      valueExtractor: item => (item.isFixedPrice ? FLAT_FEE : PER_UNIT),
      itemModelAttributes: ['isFixedPrice'],
      // Charging only applies to medications, so only export Drug products.
      productWhere: { category: INVOICE_ITEMS_CATEGORIES.DRUG },
      tabName: 'Invoice Price List Charging',
    });
  }
}
