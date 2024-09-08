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


export const TASK_FREQUENCY_UNIT = {
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
}

export const TASK_FREQUENCY_UNIT_LABELS = {
  [TASK_FREQUENCY_UNIT.MINUTE]: 'minute (s)',
  [TASK_FREQUENCY_UNIT.HOUR]: 'hour (s)',
  [TASK_FREQUENCY_UNIT.DAY]: 'day (s)',
}
