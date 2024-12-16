import {
  addMinutes,
  differenceInMinutes,
  isBefore,
  isValid,
  isWithinInterval,
  parse,
  parseISO,
} from 'date-fns';
import { isEqual } from 'lodash';
import ms from 'ms';

export const appointmentToInterval = appointment => {
  const { startTime, endTime } = appointment;
  if (!startTime || !endTime) return null;

  const start = parseISO(startTime);
  if (!isValid(start)) return null;

  const end = parseISO(endTime);
  if (!isValid(end)) return null;

  return { start, end };
};

export const isWithinIntervalExcludingEnd = (date, interval) =>
  isBefore(date, interval.end) && isWithinInterval(date, interval);

/**
 * @param {{start: Date, end: Date}} timeSlot
 * @param {{start: Date, end: Date} | null} range
 */
export const isTimeSlotWithinRange = (timeSlot, range) => {
  if (!range) return false;
  return isWithinInterval(timeSlot.start, range) && isWithinInterval(timeSlot.end, range);
};

/**
 * @param bookingSlotSettings See @tamanu/settings/src/schema/facility.ts for schema.
 * @param {Date} date
 * @return {Array<{start: Date, end: Date}>}
 */
export const calculateTimeSlots = (bookingSlotSettings, date) => {
  if (!isValid(date) || !bookingSlotSettings) return [];

  const { startTime, endTime, slotDuration } = bookingSlotSettings;
  const startOfDay = parse(startTime, 'HH:mm', date);
  const endOfDay = parse(endTime, 'HH:mm', date);
  const durationMinutes = ms(slotDuration) / 60_000;

  const slotCount = differenceInMinutes(endOfDay, startOfDay) / durationMinutes;
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    const start = addMinutes(startOfDay, i * durationMinutes);
    const end = addMinutes(start, durationMinutes);
    slots.push({ start, end });
  }

  return slots;
};

export const isSameArrayMinusHead = (testArr, referenceArr) => {
  if (referenceArr.length === 0) return false;

  const withoutHead = referenceArr.slice(1);
  return isEqual(testArr, withoutHead);
};

export const isSameArrayMinusTail = (testArr, referenceArr) => {
  if (referenceArr.length === 0) return false;

  const withoutTail = referenceArr.slice(0, -1);
  return isEqual(testArr, withoutTail);
};

/**
 * @param {Array} testArr
 * @param {Array} referenceArr
 * @returns {boolean} True if and only if `testArr` can be obtained by removing either the first
 * or last element from `referenceArr`.
 */
export const isSameArrayMinusHeadOrTail = (testArr, referenceArr) => {
  return isSameArrayMinusHead(testArr, referenceArr) || isSameArrayMinusTail(testArr, referenceArr);
};
