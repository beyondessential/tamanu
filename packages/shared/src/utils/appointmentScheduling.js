import { eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns';

export const eachMatchingWeekdayInMonth = date => {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  }).filter(day => day.getDay() === date.getDay());
};

export const nthWeekdayInMonth = (date, nth) => {
  const matchingWeekdays = eachMatchingWeekdayInMonth(date);
  // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
  const atIndex = Math.max(nth - 1, -1);
  return matchingWeekdays.at(atIndex);
};
