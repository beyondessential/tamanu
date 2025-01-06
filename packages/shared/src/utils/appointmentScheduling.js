import { DAYS_OF_WEEK } from '@tamanu/constants';
import { isSameDay } from 'date-fns';
import { eachDayInMonth } from './dateTime';

export const eachWeekdayInMonth = (date, weekday = date.getDay()) =>
  eachDayInMonth(date).filter(day => day.getDay() === weekday);

export const weekdayAtOrdinalPosition = (date, day, nth) => {
  const matchingWeekdays = eachWeekdayInMonth(date, DAYS_OF_WEEK.indexOf(day));
  // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
  const atIndex = Math.max(nth - 1, -1);
  return matchingWeekdays.at(atIndex);
};

export const getWeekdayOrdinalPosition = date => {
  const matchingWeekdays = eachWeekdayInMonth(date);
  // Ordinal positioning is 1-based, -1 means the date is the last occurrence of the weekday in the month
  const nthWeekday = matchingWeekdays.findIndex(day => isSameDay(day, date)) + 1;
  return nthWeekday === matchingWeekdays.length ? -1 : nthWeekday;
};
