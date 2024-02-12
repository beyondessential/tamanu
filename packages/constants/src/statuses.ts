export const IMAGING_REQUEST_STATUS_TYPES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELETED: 'deleted',
  ENTERED_IN_ERROR: 'entered_in_error',
};

export const IMAGING_REQUEST_STATUS_LABELS = {
  [IMAGING_REQUEST_STATUS_TYPES.PENDING]: 'Pending',
  [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: 'In progress',
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: 'Completed',
  [IMAGING_REQUEST_STATUS_TYPES.CANCELLED]: 'Cancelled',
  [IMAGING_REQUEST_STATUS_TYPES.DELETED]: 'Deleted',
  [IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR]: 'Entered in error',
};

export const IMAGING_REQUEST_STATUS_CONFIG = {
  [IMAGING_REQUEST_STATUS_TYPES.PENDING]: {
    label: IMAGING_REQUEST_STATUS_LABELS.PENDING,
    color: '#CB6100',
    background: '#FAF0E6',
  },
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: {
    label: IMAGING_REQUEST_STATUS_LABELS.COMPLETED,
    color: '#19934E',
    background: '#DEF0EE',
  },
  [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: {
    label: IMAGING_REQUEST_STATUS_LABELS.IN_PROGRESS,
    color: '#4101C9;',
    background: '#ECE6FA',
  },
  [IMAGING_REQUEST_STATUS_TYPES.CANCELLED]: {
    label: IMAGING_REQUEST_STATUS_LABELS.CANCELLED,
    color: '#444444;',
    background: '#EDEDED',
  },
  [IMAGING_REQUEST_STATUS_TYPES.DELETED]: {
    label: IMAGING_REQUEST_STATUS_LABELS.DELETED,
    color: '#444444;',
    background: '#EDEDED',
  },
  [IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR]: {
    label: IMAGING_REQUEST_STATUS_LABELS.ENTERED_IN_ERROR,
    color: '#444444;',
    background: '#EDEDED',
  },
  unknown: {
    label: IMAGING_REQUEST_STATUS_LABELS.UNKNOWN,
    color: '#444444;',
    background: '#EDEDED',
  },
};

export const APPOINTMENT_TYPES = {
  STANDARD: 'Standard',
  EMERGENCY: 'Emergency',
  SPECIALIST: 'Specialist',
  OTHER: 'Other',
};

export const APPOINTMENT_STATUSES = {
  CONFIRMED: 'Confirmed',
  ARRIVED: 'Arrived',
  NO_SHOW: 'No-show',
  CANCELLED: 'Cancelled',
};

export const REFERRAL_STATUSES = {
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const COMMUNICATION_STATUSES = {
  QUEUED: 'Queued',
  PROCESSED: 'Processed',
  SENT: 'Sent',
  ERROR: 'Error',
  DELIVERED: 'Delivered',
  BAD_FORMAT: 'Bad Format',
};

export const JOB_QUEUE_STATUSES = {
  QUEUED: 'Queued',
  STARTED: 'Started',
  COMPLETED: 'Completed',
  ERRORED: 'Errored',
};

export const COMMUNICATION_STATUSES_VALUES = Object.values(COMMUNICATION_STATUSES);

export const PATIENT_MERGE_DELETION_ACTIONS = {
  RENAME: 'RENAME',
  DESTROY: 'DESTROY',
  NONE: 'NONE',
};

// TODO: This will be merged with the statuses created as part of
// https://linear.app/bes/issue/EPI-565/data-deletion-tasks-clinical-features
export const DELETION_STATUSES = {
  DELETED: 'deleted',
};
