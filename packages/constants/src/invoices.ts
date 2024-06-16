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

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.IN_PROGRESS]: 'In progress',
  [INVOICE_STATUSES.FINALISED]: 'Finalised',
};

export const INVOICE_PAYMENT_STATUS_LABELS = {
  [INVOICE_PAYMENT_STATUSES.UNPAID]: 'Unpaid',
  [INVOICE_PAYMENT_STATUSES.PAID]: 'Paid',
  [INVOICE_PAYMENT_STATUSES.PARTIAL]: 'Partial',
  [INVOICE_PAYMENT_STATUSES.REJECTED]: 'Rejected',
  [INVOICE_PAYMENT_STATUSES.PAID_REJECTED]: 'Paid/Rejected',
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
