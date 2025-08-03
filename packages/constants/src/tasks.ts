export const TASK_STATUSES = {
  TODO: 'todo',
  COMPLETED: 'completed',
  NON_COMPLETED: 'non_completed',
};

export const TASK_ACTIONS = {
  TODO: 'todo',
  COMPLETED: 'completed',
  NON_COMPLETED: 'non_completed',
  DELETED: 'deleted',
};

export const TASK_FREQUENCY_ACCEPTED_UNITS = {
  MINUTE: 'minute',
  MINUTES: 'minutes',
  HOUR: 'hour',
  HOURS: 'hours',
  DAY: 'day',
  DAYS: 'days',
};

export const TASK_FREQUENCY_ACCEPTED_UNITS_TO_VALUE = {
  [TASK_FREQUENCY_ACCEPTED_UNITS.MINUTE]: 'minute',
  [TASK_FREQUENCY_ACCEPTED_UNITS.MINUTES]: 'minute',
  [TASK_FREQUENCY_ACCEPTED_UNITS.HOUR]: 'hour',
  [TASK_FREQUENCY_ACCEPTED_UNITS.HOURS]: 'hour',
  [TASK_FREQUENCY_ACCEPTED_UNITS.DAY]: 'day',
  [TASK_FREQUENCY_ACCEPTED_UNITS.DAYS]: 'day',
};

export const TASK_FREQUENCY_UNIT = {
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
};

export const TASK_FREQUENCY_UNIT_LABELS = {
  [TASK_FREQUENCY_UNIT.MINUTE]: 'minute (s)',
  [TASK_FREQUENCY_UNIT.HOUR]: 'hour (s)',
  [TASK_FREQUENCY_UNIT.DAY]: 'day (s)',
};

export const TASK_DURATION_UNIT = {
  HOURS: 'hours',
  DAYS: 'days',
  OCCURRENCES: 'occurrences',
};

export const TASK_DURATION_UNIT_LABELS = {
  [TASK_DURATION_UNIT.HOURS]: 'hour (s)',
  [TASK_DURATION_UNIT.DAYS]: 'day (s)',
  [TASK_DURATION_UNIT.OCCURRENCES]: 'occurrence (s)',
};

export const TASK_NOTE_COMPLETE_OVERDUE_REASON_ID = 'tasknotcompletedreason-taskoverdue';

export const TASK_DELETE_BY_SYSTEM_REASON = 'taskdeletionreason-deletedbysystem';

export const TASK_DELETE_RECORDED_IN_ERROR_REASON_ID = 'taskdeletionreason-recordedinerror';

export const TASK_DELETE_PATIENT_DISCHARGED_REASON_ID = 'taskdeletionreason-patientdischarged';

export const TASK_TYPES = {
  NORMAL_TASK: 'normal_task',
  MEDICATION_DUE_TASK: 'medication_due_task',
};

export const DASHBOARD_ONLY_TASK_TYPES = [TASK_TYPES.MEDICATION_DUE_TASK];
