import { INVOICE_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUSES.CANCELLED]: TAMANU_COLORS.darkestText,
  [INVOICE_STATUSES.IN_PROGRESS]: TAMANU_COLORS.darkOrange,
  [INVOICE_STATUSES.FINALISED]: TAMANU_COLORS.green,
};

export const INVOICE_ITEM_ACTION_MODAL_TYPES = {
  ADD_DISCOUNT: 'addDiscount',
  ADD_MARKUP: 'addMarkupLine',
  REMOVE_DISCOUNT_MARKUP: 'removeDiscountMarkup',
  DELETE: 'delete',
  ADD_NOTE: 'addNote',
};

export const INVOICE_MODAL_TYPES = {
  EDIT_INVOICE: 'editInvoice',
  CREATE_INVOICE: 'createInvoice',
  CANCEL_INVOICE: 'cancelInvoice',
  FINALISE_INVOICE: 'finaliseInvoice',
  DELETE_INVOICE: 'deleteInvoice',
};

export const INVOICE_DISCOUNT_TYPES = {
  MANUAL: 'manual',
  ASSESSMENT: 'assessment',
};

export const CHEQUE_PAYMENT_METHOD_ID = 'paymentMethod-cheque';
