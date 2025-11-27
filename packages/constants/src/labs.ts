import { VISIBILITY_STATUSES } from './importable.js';
import { COLORS } from './colors.js';

export const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  INTERIM_RESULTS: 'interim_results',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  INVALIDATED: 'invalidated',
  DELETED: 'deleted',
  SAMPLE_NOT_COLLECTED: 'sample-not-collected',
  ENTERED_IN_ERROR: 'entered-in-error',
};

export const LAB_REQUEST_STATUS_LABELS = {
  [LAB_REQUEST_STATUSES.RECEPTION_PENDING]: 'Reception pending',
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: 'Results pending',
  [LAB_REQUEST_STATUSES.INTERIM_RESULTS]: 'Interim results',
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: 'To be verified',
  [LAB_REQUEST_STATUSES.VERIFIED]: 'Verified',
  [LAB_REQUEST_STATUSES.PUBLISHED]: 'Published',
  [LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED]: 'Sample not collected',
  [LAB_REQUEST_STATUSES.CANCELLED]: 'Cancelled',
  [LAB_REQUEST_STATUSES.INVALIDATED]: 'Invalidated',
  [LAB_REQUEST_STATUSES.DELETED]: 'Deleted',
  [LAB_REQUEST_STATUSES.ENTERED_IN_ERROR]: 'Entered in error',
};

export const LAB_REQUEST_STATUS_CONFIG = {
  [LAB_REQUEST_STATUSES.RECEPTION_PENDING]: {
    color: COLORS.pink,
  },
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: {
    color: COLORS.darkOrange,
  },
  [LAB_REQUEST_STATUSES.INTERIM_RESULTS]: {
    color: '#006278',
  },
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: {
    color: COLORS.metallicYellow,
  },
  [LAB_REQUEST_STATUSES.VERIFIED]: {
    color: COLORS.blue,
  },
  [LAB_REQUEST_STATUSES.PUBLISHED]: {
    color: COLORS.green,
  },
  [LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED]: {
    color: COLORS.purple,
  },
  [LAB_REQUEST_STATUSES.CANCELLED]: {
    color: COLORS.grey,
  },
  [LAB_REQUEST_STATUSES.INVALIDATED]: {
    color: COLORS.grey,
  },
  [LAB_REQUEST_STATUSES.DELETED]: {
    color: COLORS.grey,
  },
  [LAB_REQUEST_STATUSES.ENTERED_IN_ERROR]: {
    color: COLORS.red,
    background: '#FFCEC7',
  },
  unknown: {
    label: 'Unknown',
    color: COLORS.grey,
  },
};

export const LAB_TEST_RESULT_TYPES = {
  FREE_TEXT: 'FreeText',
  NUMBER: 'Number',
  SELECT: 'Select',
};

export const LAB_REQUEST_FORM_TYPES = {
  PANEL: 'panel',
  INDIVIDUAL: 'individual',
  SUPERSET: 'superset',
};

export const LAB_TEST_TYPE_VISIBILITY_STATUSES = {
  ...VISIBILITY_STATUSES,
  PANEL_ONLY: 'panelOnly',
};

// These are the status groupings for the versions of lab request table that filter by different statuses
export const LAB_REQUEST_TABLE_STATUS_GROUPINGS: {
  ACTIVE: string[];
  COMPLETED: string[];
} = {
  ACTIVE: [
    LAB_REQUEST_STATUSES.RECEPTION_PENDING,
    LAB_REQUEST_STATUSES.RESULTS_PENDING,
    LAB_REQUEST_STATUSES.INTERIM_RESULTS,
    LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
    LAB_REQUEST_STATUSES.VERIFIED,
  ],
  COMPLETED: [LAB_REQUEST_STATUSES.PUBLISHED, LAB_REQUEST_STATUSES.INVALIDATED],
};

export const INVOICEABLE_LAB_REQUEST_STATUSES = [
  LAB_REQUEST_STATUSES.RECEPTION_PENDING,
  LAB_REQUEST_STATUSES.RESULTS_PENDING,
  LAB_REQUEST_STATUSES.INTERIM_RESULTS,
  LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
  LAB_REQUEST_STATUSES.VERIFIED,
  LAB_REQUEST_STATUSES.PUBLISHED,
  LAB_REQUEST_STATUSES.INVALIDATED,
];
