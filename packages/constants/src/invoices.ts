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
