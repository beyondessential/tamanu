import { ProductMatrixByCodeExporter } from './ProductMatrixByCodeExporter';

// - First column: invoiceProductId
// - Subsequent columns: one per InvoiceInsurancePlan.code
// - Cell values: coverageValue for that product in that contract, blank if none
export class InvoiceInsurancePlanItemExporter extends ProductMatrixByCodeExporter {
  constructor(context, dataType) {
    super(context, dataType, {
      parentModel: 'InvoiceInsurancePlan',
      itemModel: 'InvoiceInsurancePlanItem',
      parentIdField: 'invoiceInsurancePlanId',
      valueField: 'coverageValue',
      tabName: 'Invoice Insurance Plan Items',
    });
  }
}
