export const INVOICE_STATUSES = {
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'in_progress',
  FINALISED: 'finalised',
};

export const INVOICE_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
  REJECTED: 'rejected',
  PAID_REJECTED: 'paid/rejected',
};

export const INVOICE_ITEM_CATEGORY_TYPES = {
  PROCEDURE_TYPE: 'procedureType',
  IMAGING_TYPE: 'imagingType',
  LAB_TEST_TYPE: 'labTestType',
  ADDITIONAL_INVOICE_PRODUCT: 'additionalInvoiceProduct',
};

export const INVOICE_ITEMS_CATEGORY_LABELS = {
  [INVOICE_ITEM_CATEGORY_TYPES.PROCEDURE_TYPE]: 'Procedure',
  [INVOICE_ITEM_CATEGORY_TYPES.IMAGING_TYPE]: 'Imaging',
  [INVOICE_ITEM_CATEGORY_TYPES.LAB_TEST_TYPE]: 'Lab test',
  [INVOICE_ITEM_CATEGORY_TYPES.ADDITIONAL_INVOICE_PRODUCT]: 'Additional',
};
