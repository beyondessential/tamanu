import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '@tamanu/constants';
import { Colors } from './styles';

export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUSES.CANCELLED]: Colors.darkestText,
  [INVOICE_STATUSES.IN_PROGRESS]: Colors.darkOrange,
  [INVOICE_STATUSES.FINALISED]: Colors.green,
};

export const INVOICE_ITEM_ACTION_MODAL_TYPES = {
  ADD_DISCOUNT: 'addDiscount',
  ADD_MARKUP: 'addMarkupLine',
  REMOVE_DISCOUNT_MARKUP: 'removeDiscountMarkup',
  DELETE: 'delete',
};

export const INVOICE_MODAL_TYPES = {
  EDIT_INVOICE: "editInvoice",
  CREATE_INVOICE: "createInvoice",
  CANCEL_INVOICE: "cancelInvoice",
  FINALISE_INVOICE: "finaliseInvoice",
};

export const INVOICE_DISCOUNT_TYPES = {
  MANUAL: 'manual',
  ASSESSMENT: 'assessment',
};

export const slidingFeeScaleTable = [
  [0, 5700, 10050, 12600, 14100, 17500],
  [0, 6600, 13500, 16300, 19000, 21800],
  [0, 7400, 17000, 20500, 23900, 27500],
  [0, 8500, 20600, 24800, 28900, 32500],
  [0, 9700, 24200, 29000, 33800, 38700],
  [0, 10700, 27700, 33200, 37500, 43000],
  [0, 11500, 31200, 37400, 43700, 46000],
  [0, 12600, 34700, 41600, 48600, 55600],
  [0, 14800, 38300, 45900, 53600, 65000],
  [0, 16600, 41800, 50200, 58500, 70000],
  [0, 18900, 45300, 54400, 63400, 75000],
  [0, 23500, 48800, 58600, 68400, 85000]
];
