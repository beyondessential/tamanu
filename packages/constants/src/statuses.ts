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
    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.PENDING],
    color: '#CB6100',
    background: '#FAF0E6',
  },
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: {
    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.COMPLETED],
    color: '#19934E',
    background: '#DEF0EE',
  },
  [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: {
    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS],
    color: '#4101C9;',
    background: '#ECE6FA',
  },
  [IMAGING_REQUEST_STATUS_TYPES.CANCELLED]: {
    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.CANCELLED],
    color: '#444444;',
    background: '#EDEDED',
  },
  [IMAGING_REQUEST_STATUS_TYPES.DELETED]: {
    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.DELETED],
    color: '#444444;',
    background: '#EDEDED',
  },
  [IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR]: {
    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR],
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

export const APPOINTMENT_TYPE_LABELS = {
  [APPOINTMENT_TYPES.STANDARD]: 'Standard',
  [APPOINTMENT_TYPES.EMERGENCY]: 'Emergency',
  [APPOINTMENT_TYPES.SPECIALIST]: 'Specialist',
  [APPOINTMENT_TYPES.OTHER]: 'Other',
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

export const REFERRAL_STATUS_LABELS = {
  [REFERRAL_STATUSES.PENDING]: 'Pending',
  [REFERRAL_STATUSES.CANCELLED]: 'Cancelled',
  [REFERRAL_STATUSES.COMPLETED]: 'Completed',
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
