import { INVOICE_STATUS_TYPES } from 'shared/constants';

export const isInvoiceEditable = status =>
  ![INVOICE_STATUS_TYPES.FINALISED, INVOICE_STATUS_TYPES.CANCELLED].includes(status);
