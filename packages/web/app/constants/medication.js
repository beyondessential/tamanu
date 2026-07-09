import { DRUG_STOCK_STATUSES } from '@tamanu/constants';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const MAR_WARNING_MODAL = /** @type {const} */ ({
  PAUSED: 'paused',
  FUTURE: 'future',
  PAST: 'past',
  NOT_MATCHING_DOSE: 'notMatchingDose',
});

export const PRESCRIPTION_TYPES = /** @type {const} */ ({
  SINGLE_MEDICATION: 'SINGLE_MEDICATION',
  MEDICATION_SET: 'MEDICATION_SET',
});

export const MEDICATIONS_SEARCH_KEYS = /** @type {const} */ ({
  ACTIVE: 'active',
  DISPENSED: 'dispensed',
});

export const STOCK_STATUS_COLORS = /** @type {const} */ ({
  [DRUG_STOCK_STATUSES.IN_STOCK]: TAMANU_COLORS.green,
  [DRUG_STOCK_STATUSES.OUT_OF_STOCK]: TAMANU_COLORS.alert,
  [DRUG_STOCK_STATUSES.UNKNOWN]: TAMANU_COLORS.darkestText,
});
