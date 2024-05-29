import { INVOICE_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';
import { Colors } from './styles';

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.IN_PROGRESS]: 'In progress',
  [INVOICE_STATUSES.FINALISED]: 'Finalised',
};

export const INVOICE_STATUS_OPTIONS = [
  {
    value: INVOICE_STATUSES.CANCELLED,
    label: INVOICE_STATUS_LABELS[INVOICE_STATUSES.CANCELLED],
  },
  {
    value: INVOICE_STATUSES.IN_PROGRESS,
    label: INVOICE_STATUS_LABELS[INVOICE_STATUSES.IN_PROGRESS],
  },
  {
    value: INVOICE_STATUSES.FINALISED,
    label: INVOICE_STATUS_LABELS[INVOICE_STATUSES.FINALISED],
  },
];

export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUSES.CANCELLED]: Colors.darkestText,
  [INVOICE_STATUSES.IN_PROGRESS]: Colors.darkOrange,
  [INVOICE_STATUSES.FINALISED]: Colors.green,
};

export const INVOICE_PAYMENT_STATUS_LABELS = {
  [INVOICE_PAYMENT_STATUSES.UNPAID]: 'Unpaid',
  [INVOICE_PAYMENT_STATUSES.PAID]: 'Paid',
  [INVOICE_PAYMENT_STATUSES.PARTIAL]: 'Partial',
  [INVOICE_PAYMENT_STATUSES.REJECTED]: 'Rejected',
  [INVOICE_PAYMENT_STATUSES.PAID_REJECTED]: 'Paid/Rejected',
};

export const INVOICE_PAYMENT_STATUS_OPTIONS = [
  {
    value: INVOICE_PAYMENT_STATUSES.UNPAID,
    label: INVOICE_PAYMENT_STATUS_LABELS[INVOICE_PAYMENT_STATUSES.UNPAID],
  },
  {
    value: INVOICE_PAYMENT_STATUSES.PAID,
    label: INVOICE_PAYMENT_STATUS_LABELS[INVOICE_PAYMENT_STATUSES.PAID],
  },
];

export const INVOICE_ACTION_MODALS = {
  ADD_DISCOUNT: 'addDiscount',
  ADD_MARKUP: 'addMarkup',
  DELETE: 'delete',
  CANCEL_INVOICE: 'cancelInvoice',
};
