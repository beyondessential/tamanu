import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

export function invoicePriceListItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoicePriceList',
    itemModel: 'InvoicePriceListItem',
    parentIdField: 'invoicePriceListId',
    valueField: 'price',
    valueExtractor: value => {
      const isSpecialValue = value === 'manual-entry' || value === 'hidden';
      const parsedValue = isSpecialValue ? null : Number(value);
      const isValidValue = isSpecialValue ? true : !Number.isNaN(parsedValue);
      return { parsedValue, isValidValue };
    },
    messages: {
      duplicateCode: code => `duplicate price list code: ${code}`,
      missingParentByCode: code => `InvoicePriceList with code '${code}' does not exist`,
      couldNotFindParentId: code => `Could not find InvoicePriceList ID for code '${code}'`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid price value '${raw}' for priceList '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
