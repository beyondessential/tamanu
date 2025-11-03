import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

/**
 * Thin wrapper that configures the generic matrix loader for price list items.
 * Preserves existing behavior and error messages.
 */
export function invoicePriceListItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoicePriceList',
    itemModel: 'InvoicePriceListItem',
    parentIdField: 'invoicePriceListId',
    valueField: 'price',
    messages: {
      duplicateCode: code => `duplicate price list code: ${code}`,
      missingParentByCode: code => `InvoicePriceList with code '${code}' does not exist`,
      couldNotFindParentId: code => `Could not find InvoicePriceList ID for code '${code}'`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid price value '${raw}' for priceList '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
