export const DAYS_OF_WEEK = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const REPEAT_FREQUENCY = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

export const REPEAT_FREQUENCY_VALUES = Object.values(REPEAT_FREQUENCY);

export const REPEAT_FREQUENCY_LABELS = {
  [REPEAT_FREQUENCY.WEEKLY]: 'weekly',
  [REPEAT_FREQUENCY.MONTHLY]: 'monthly',
};

export const REPEAT_FREQUENCY_UNIT_LABELS = {
  [REPEAT_FREQUENCY.WEEKLY]: 'week',
  [REPEAT_FREQUENCY.MONTHLY]: 'month',
};

export const REPEAT_FREQUENCY_UNIT_PLURAL_LABELS = {
  [REPEAT_FREQUENCY.WEEKLY]: 'weeks',
  [REPEAT_FREQUENCY.MONTHLY]: 'months',
};

export const MODIFY_REPEATING_APPOINTMENT_MODE = {
  THIS_APPOINTMENT: 'thisAppointment',
  THIS_AND_FUTURE_APPOINTMENTS: 'thisAndFutureAppointments',
};
