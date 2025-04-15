import { isValid, parseISO } from 'date-fns';
import { isEqual } from 'lodash';

export const appointmentToInterval = (appointment) => {
  const { startTime, endTime } = appointment;
  if (!startTime || !endTime) return null;

  const start = parseISO(startTime);
  if (!isValid(start)) return null;

  const end = parseISO(endTime);
  if (!isValid(end)) return null;

  return { start, end };
};

export const idOfTimeSlot = (timeSlot) => timeSlot.start.valueOf();

export const isSameArrayMinusHead = (testArr, referenceArr) => {
  if (testArr.length !== referenceArr.length - 1) return false;

  const withoutHead = referenceArr.slice(1);
  return isEqual(testArr, withoutHead);
};

export const isSameArrayMinusTail = (testArr, referenceArr) => {
  if (testArr.length !== referenceArr.length - 1) return false;

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
