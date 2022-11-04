export const MEDICATION_STATUSES = {
  COMPLETED: 'Completed',
  FULFILLED: 'Fulfilled',
  REQUESTED: 'Requested',
};

export const OPERATION_PLAN_STATUSES = {
  PLANNED: 'Planned',
  DROPPED: 'Dropped',
  COMPLETED: 'Completed',
};

export const IMAGING_REQUEST_STATUS_TYPES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const IMAGING_REQUEST_STATUS_LABELS = {
  [IMAGING_REQUEST_STATUS_TYPES.PENDING]: 'Pending',
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: 'Completed',
  [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: 'In progress',
};

export const IMAGING_REQUEST_STATUS_OPTIONS = Object.values(IMAGING_REQUEST_STATUS_TYPES).map(
  s => ({
    label: IMAGING_REQUEST_STATUS_LABELS[s],
    value: s,
  }),
);

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

export const COMMUNICATION_STATUSES_VALUES = Object.values(COMMUNICATION_STATUSES);

export const PATIENT_MERGE_DELETION_ACTIONS = {
  RENAME: 'RENAME',
  DESTROY: 'DESTROY',
  NONE: 'NONE',
};

export const LOCATION_AVAILABILITY_STATUS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  OCCUPIED: 'Occupied',
};
