import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

/**
 * Thin wrapper that configures the generic matrix loader for insurance contract items.
 * Preserves existing behavior and error messages.
 */
export function invoiceInsuranceContractItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoiceInsuranceContract',
    itemModel: 'InvoiceInsuranceContractItem',
    parentIdField: 'invoiceInsuranceContractId',
    valueField: 'coverageValue',
    messages: {
      duplicateCode: code => `duplicate insurance contract code: ${code}`,
      missingParentByCode: code => `InvoiceInsuranceContract with code '${code}' does not exist`,
      couldNotFindParentId: code => `Could not find InvoiceInsuranceContract ID for code '${code}'`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid coverage value '${raw}' for insuranceContract '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
