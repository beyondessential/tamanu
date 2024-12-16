import { eachDayOfInterval, endOfMonth, isSameDay, startOfMonth } from 'date-fns';

export const eachMatchingWeekdayInMonth = date => {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  }).filter(day => day.getDay() === date.getDay());
};

export const weekdayAtOrdinalPosition = (date, nth) => {
  const matchingWeekdays = eachMatchingWeekdayInMonth(date);
  // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
  const atIndex = Math.max(nth - 1, -1);
  return matchingWeekdays.at(atIndex);
};

export const getWeekdayOrdinalPosition = date => {
  const matchingWeekdays = eachMatchingWeekdayInMonth(date);
  // Ordinal positioning is 1-based, -1 means the date is the last occurrence of the weekday in the month
  const nthWeekday = matchingWeekdays.findIndex(day => isSameDay(day, date)) + 1;
  return nthWeekday === matchingWeekdays.length ? -1 : nthWeekday;
};
