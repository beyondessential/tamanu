export const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  DELETED: 'deleted',
  NOT_COLLECTED: 'not-collected',
  ENTERED_IN_ERROR: 'entered-in-error',
};

export const LAB_REQUEST_STATUS_CONFIG = {
  [LAB_REQUEST_STATUSES.RECEPTION_PENDING]: {
    label: 'Reception pending',
    color: '#CB6100',
    background: '#FAF0E6',
  },
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: {
    label: 'Results pending',
    color: '#19934E',
    background: '#DEF0EE',
  },
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: {
    label: 'To be verified',
    color: '#4101C9;',
    background: '#ECE6FA',
  },
  [LAB_REQUEST_STATUSES.VERIFIED]: {
    label: 'Verified',
    color: '#4101C9;',
    background: '#ECE6FA',
  },
  [LAB_REQUEST_STATUSES.PUBLISHED]: {
    label: 'Published',
    color: '#4101C9',
    background: '#ECE6FA',
  },
  [LAB_REQUEST_STATUSES.NOT_COLLECTED]: {
    label: 'Not collected',
    color: '#4101C9',
    background: '#ECE6FA',
  },
  [LAB_REQUEST_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    color: '#444444',
    background: '#EDEDED',
  },
  [LAB_REQUEST_STATUSES.DELETED]: {
    label: 'Deleted',
    color: '#444444',
    background: '#EDEDED',
  },
  [LAB_REQUEST_STATUSES.ENTERED_IN_ERROR]: {
    label: 'Entered in error',
    color: '#444444',
    background: '#EDEDED',
  },
  unknown: {
    label: 'Unknown',
    color: '#444444',
    background: '#EDEDED',
  },
};

export const LAB_TEST_STATUSES = LAB_REQUEST_STATUSES;

export const LAB_TEST_RESULT_TYPES = {
  FREE_TEXT: 'FreeText',
  NUMBER: 'Number',
  SELECT: 'Select',
};

export const LAB_REQUEST_SELECT_LAB_METHOD = {
  PANEL: 'panel',
  INDIVIDUAL: 'individual',
};
