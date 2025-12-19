import { STOCK_STATUSES } from '@tamanu/constants';
import { Colors } from './styles';

export const MAR_WARNING_MODAL = {
  PAUSED: 'paused',
  FUTURE: 'future',
  PAST: 'past',
  NOT_MATCHING_DOSE: 'notMatchingDose',
};

export const PRESCRIPTION_TYPES = {
  SINGLE_MEDICATION: 'SINGLE_MEDICATION',
  MEDICATION_SET: 'MEDICATION_SET',
};

export const MEDICATIONS_SEARCH_KEYS = {
  ACTIVE: 'active',
  DISPENSED: 'dispensed',
};

export const STOCK_STATUS_COLORS = {
  [STOCK_STATUSES.YES]: Colors.green,
  [STOCK_STATUSES.NO]: Colors.alert,
  [STOCK_STATUSES.UNKNOWN]: Colors.darkestText,
};
