import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

export function invoiceInsurancePlanItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoiceInsurancePlan',
    itemModel: 'InvoiceInsurancePlanItem',
    parentIdField: 'invoiceInsurancePlanId',
    valueField: 'coverageValue',
    messages: {
      duplicateCode: code => `duplicate insurance plan code: ${code}`,
      missingParentByCode: code => `InvoiceInsurancePlan with code '${code}' does not exist`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid coverage value '${raw}' for insurancePlan '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
