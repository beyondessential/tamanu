export const INVOICE_STATUSES = {
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'in_progress',
  FINALISED: 'finalised',
};

export const INVOICE_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
};

export const INVOICE_LINE_TYPES = {
  PROCEDURE_TYPE: 'procedureType',
  IMAGING_TYPE: 'imagingType',
  LAB_TEST_TYPE: 'labTestType',
  ADDITIONAL: 'additionalInvoiceLine',
};

export const INVOICE_LINE_TYPE_LABELS = {
  [INVOICE_LINE_TYPES.PROCEDURE_TYPE]: 'Procedure',
  [INVOICE_LINE_TYPES.IMAGING_TYPE]: 'Imaging',
  [INVOICE_LINE_TYPES.LAB_TEST_TYPE]: 'Lab test',
  [INVOICE_LINE_TYPES.ADDITIONAL]: 'Additional',
};

export const INVOICE_LINE_ITEM_STATUSES = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};

export const INVOICE_PRICE_CHANGE_TYPES = {
  PATIENT_BILLING_TYPE: 'patientBillingType',
};

export const INVOICE_PRICE_CHANGE_TYPE_LABELS = {
  [INVOICE_PRICE_CHANGE_TYPES.PATIENT_BILLING_TYPE]: 'Patient Type',
};

export const INVOICE_PRICE_CHANGE_ITEM_STATUSES = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};
