export const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
  DELETED: 'deleted',
};

export const LAB_REQUEST_STATUS_LABELS = {
  [LAB_REQUEST_STATUSES.RECEPTION_PENDING]: 'Reception pending',
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: 'Results pending',
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: 'To be verified',
  [LAB_REQUEST_STATUSES.VERIFIED]: 'Verified',
  [LAB_REQUEST_STATUSES.PUBLISHED]: 'Published',
};
// Leave out deleted status from options

export const LAB_REQUEST_STATUS_OPTIONS = Object.values(LAB_REQUEST_STATUSES)
  .filter(status => status !== LAB_REQUEST_STATUSES.DELETED)
  .map(s => ({
    label: LAB_REQUEST_STATUS_LABELS[s],
    value: s,
  }));

export const LAB_TEST_STATUSES = LAB_REQUEST_STATUSES;

export const LAB_TEST_RESULT_TYPES = {
  FREE_TEXT: 'FreeText',
  NUMBER: 'Number',
  SELECT: 'Select',
};
