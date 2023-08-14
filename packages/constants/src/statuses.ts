export const IMAGING_REQUEST_STATUS_TYPES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELETED: 'deleted',
  ENTERED_IN_ERROR: 'entered_in_error',
};

export const IMAGING_REQUEST_STATUS_CONFIG = {
  [IMAGING_REQUEST_STATUS_TYPES.PENDING]: {
    label: 'Pending',
    color: '#CB6100',
    background: '#FAF0E6',
  },
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: {
    label: 'Completed',
    color: '#19934E',
    background: '#DEF0EE',
  },
  [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: {
    label: 'In progress',
    color: '#4101C9;',
    background: '#ECE6FA',
  },
  [IMAGING_REQUEST_STATUS_TYPES.CANCELLED]: {
    label: 'Cancelled',
    color: '#444444;',
    background: '#EDEDED',
  },
  [IMAGING_REQUEST_STATUS_TYPES.DELETED]: {
    label: 'Deleted',
    color: '#444444;',
    background: '#EDEDED',
  },
  [IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR]: {
    label: 'Entered in error',
    color: '#444444;',
    background: '#EDEDED',
  },
  unknown: {
    label: 'Unknown',
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

export const COMMUNICATION_STATUSES_VALUES = Object.values(
  COMMUNICATION_STATUSES,
);

export const PATIENT_MERGE_DELETION_ACTIONS = {
  RENAME: 'RENAME',
  DESTROY: 'DESTROY',
  NONE: 'NONE',
};
