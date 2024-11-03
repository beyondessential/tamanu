import { isWithinInterval } from 'date-fns';

/**
 * @param {{start: Date, end: Date}} timeSlot
 * @param {{start: Date, end: Date}} range
 */
export const isTimeSlotWithinRange = (timeSlot, range) => {
  if (!range) return false;
  return isWithinInterval(timeSlot.start, range) && isWithinInterval(timeSlot.end, range);
};
