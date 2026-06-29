import { INVOICE_PRICE_LIST_CHARGING_VALUES } from '@tamanu/constants';
import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

const { FLAT_FEE, PER_UNIT } = INVOICE_PRICE_LIST_CHARGING_VALUES;

export class InvoicePriceListChargingExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoicePriceList',
      itemModel: 'InvoicePriceListItem',
      parentIdField: 'invoicePriceListId',
      valueField: 'isFixedPrice',
      // Emit an explicit charging type for every item so the sheet re-imports without blanks.
      valueExtractor: item => (item.isFixedPrice ? FLAT_FEE : PER_UNIT),
      itemModelAttributes: ['isFixedPrice'],
      tabName: 'Invoice Price List Charging',
    });
  }
}
