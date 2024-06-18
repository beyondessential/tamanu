import { REFERENCE_TYPES } from "./importable";

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

export const POTENTIAL_INVOICE_ITEMS_CATEGORY_LABELS = {
  [REFERENCE_TYPES.PROCEDURE_TYPE]: 'Procedure',
  [REFERENCE_TYPES.IMAGING_TYPE]: 'Imaging',
  'labTestType': 'Lab test',
  [REFERENCE_TYPES.ADDITIONAL_INVOICE_PRODUCT]: 'Additional',
};
