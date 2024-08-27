export const TASK_STATUSES = {
  TODO: 'todo',
  COMPLETED: 'completed',
  NON_COMPLETED: 'non_completed',
};

export const TASK_FREQUENCY_ACCEPTED_UNITS = {
  MINUTE: 'minute',
  MINUTES: 'minutes',
  HOUR: 'hour',
  HOURS: 'hours',
  DAY: 'day',
  DAYS: 'days',
}

export const TASK_FREQUENCY_ACCEPTED_UNITS_TO_VALUE = {
  [TASK_FREQUENCY_ACCEPTED_UNITS.MINUTE]: 'minute',
  [TASK_FREQUENCY_ACCEPTED_UNITS.MINUTES]: 'minute',
  [TASK_FREQUENCY_ACCEPTED_UNITS.HOUR]: 'hour',
  [TASK_FREQUENCY_ACCEPTED_UNITS.HOURS]: 'hour',
  [TASK_FREQUENCY_ACCEPTED_UNITS.DAY]: 'day',
  [TASK_FREQUENCY_ACCEPTED_UNITS.DAYS]: 'day',
}
