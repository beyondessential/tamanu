import { OTHER_REFERENCE_TYPES, REFERENCE_TYPES } from './importable';

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

export const INVOICE_ITEMS_CATEGORY_LABELS = {
  [REFERENCE_TYPES.PROCEDURE_TYPE]: 'Procedure',
  [REFERENCE_TYPES.IMAGING_TYPE]: 'Imaging',
  [OTHER_REFERENCE_TYPES.LAB_TEST_TYPE]: 'Lab test',
  [REFERENCE_TYPES.ADDITIONAL_INVOICE_PRODUCT]: 'Additional',
};

export const INVOICE_PATIENT_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
};

export const INVOICE_INSURER_PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
  REJECTED: 'rejected',
};
