import { VISIBILITY_STATUSES } from './importable';

export const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
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
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.RECEPTION_PENDING],
    color: '#D10580',
  },
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.RESULTS_PENDING],
    color: '#CB6100',
  },
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.TO_BE_VERIFIED],
    color: '#BD9503',
  },
  [LAB_REQUEST_STATUSES.VERIFIED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.VERIFIED],
    color: '#1172D1',
  },
  [LAB_REQUEST_STATUSES.PUBLISHED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.PUBLISHED],
    color: '#19934E',
  },
  [LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED],
    color: '#4101C9',
  },
  [LAB_REQUEST_STATUSES.CANCELLED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.CANCELLED],
    color: '#444444',
  },
  [LAB_REQUEST_STATUSES.INVALIDATED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.INVALIDATED],
    color: '#444444',
  },
  [LAB_REQUEST_STATUSES.DELETED]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.DELETED],
    color: '#444444',
  },
  [LAB_REQUEST_STATUSES.ENTERED_IN_ERROR]: {
    label: LAB_REQUEST_STATUS_LABELS[LAB_REQUEST_STATUSES.ENTERED_IN_ERROR],
    color: '#F76853',
    background: '#FFCEC7',
  },
  unknown: {
    label: 'Unknown',
    color: '#444444',
  },
};

export const LAB_TEST_STATUSES = LAB_REQUEST_STATUSES;

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
