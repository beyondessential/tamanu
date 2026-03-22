import { REPEAT_FREQUENCY } from '@tamanu/constants';

export const THIS_WEEK_ID = 'location-assignments-calendar__this-week';
export const FIRST_DISPLAYED_DAY_ID = 'location-assignments-calendar__beginning';

export const BOOKING_SLOT_TYPES = {
  BOOKINGS: 'bookings',
  ASSIGNMENTS: 'assignments',
};

export const ENDS_MODES = {
  ON: 'on',
  AFTER: 'after',
};

export const ASSIGNMENT_SCHEDULE_INITIAL_VALUES = {
  interval: 1,
  frequency: REPEAT_FREQUENCY.WEEKLY,
  endsMode: ENDS_MODES.ON,
};

export const APPOINTMENT_SCHEDULE_INITIAL_VALUES = {
  interval: 1,
  frequency: REPEAT_FREQUENCY.WEEKLY,
  endsMode: ENDS_MODES.ON,
};

export const MODIFY_REPEATING_ASSIGNMENT_MODE = {
  THIS_ASSIGNMENT: 'thisAssignment',
  THIS_AND_FUTURE_ASSIGNMENTS: 'thisAndFutureAssignments',
};
