export const DAYS_OF_WEEK = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export const REPEAT_FREQUENCY = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
};

export const REPEAT_FREQUENCY_VALUES = Object.values(REPEAT_FREQUENCY);

export const REPEAT_FREQUENCY_LABELS = {
  [REPEAT_FREQUENCY.WEEKLY]: 'weekly',
  [REPEAT_FREQUENCY.MONTHLY]: 'monthly',
};

export const REPEAT_FREQUENCY_UNIT_LABELS = {
  [REPEAT_FREQUENCY.WEEKLY]: 'week',
  [REPEAT_FREQUENCY.MONTHLY]: 'month',
};
