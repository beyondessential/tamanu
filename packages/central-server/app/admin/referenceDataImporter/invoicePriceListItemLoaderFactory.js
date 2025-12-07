import { INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

const { HIDDEN } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

export function invoicePriceListItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoicePriceList',
    itemModel: 'InvoicePriceListItem',
    parentIdField: 'invoicePriceListId',
    valueField: 'price',
    valueExtractor: (value, isEmpty) => {
      const isSpecialValue = isEmpty || value === HIDDEN;
      const parsedValue = isSpecialValue ? null : Number(value);
      const isValidValue = isSpecialValue ? true : !Number.isNaN(parsedValue);
      const visibilityStatus = value === HIDDEN ? VISIBILITY_STATUSES.HISTORICAL : VISIBILITY_STATUSES.CURRENT;
      return { parsedValue, isValidValue, visibilityStatus };
    },
    allowEmptyValues: true,
    messages: {
      duplicateCode: code => `duplicate price list code: ${code}`,
      missingParentByCode: code => `InvoicePriceList with code '${code}' does not exist`,
      couldNotFindParentId: code => `Could not find InvoicePriceList ID for code '${code}'`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid price value '${raw}' for priceList '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
