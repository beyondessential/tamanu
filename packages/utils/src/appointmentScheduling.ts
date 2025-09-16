import {
  DAYS_OF_WEEK,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_UNIT_PLURAL_LABELS,
} from '@tamanu/constants';
import { isSameDay, add, parseISO, set, format } from 'date-fns';
import { eachDayInMonth, toDateString } from './dateTime';

export const eachWeekdayInMonth = (date: Date, weekday = date.getDay()) =>
  eachDayInMonth(date).filter(day => day.getDay() === weekday);

export const weekdayAtOrdinalPosition = (
  date: Date,
  day: (typeof DAYS_OF_WEEK)[number],
  nth: number,
) => {
  const matchingWeekdays = eachWeekdayInMonth(date, DAYS_OF_WEEK.indexOf(day));
  // Convert ordinal positioning to 0-based index but leave -1 as last occurrence
  const atIndex = Math.max(nth - 1, -1);
  const matchingWeekday = matchingWeekdays.at(atIndex);
  if (!matchingWeekday) {
    throw new Error('No weekday found at the specified ordinal position');
  }
  return matchingWeekday;
};

export const getWeekdayOrdinalPosition = (date: Date) => {
  const matchingWeekdays = eachWeekdayInMonth(date);
  // Ordinal positioning is 1-based, -1 means the date is the last occurrence of the weekday in the month
  const nthWeekday = matchingWeekdays.findIndex(day => isSameDay(day, date)) + 1;
  return nthWeekday === matchingWeekdays.length ? -1 : nthWeekday;
};

export const adjustDateForFrequency = (
  date: Date,
  repeatUnit: keyof typeof REPEAT_FREQUENCY,
  dayOfWeek: string,
  nthWeekday: number,
) => {
  if (repeatUnit === REPEAT_FREQUENCY.MONTHLY) {
    return set(date, {
      date: weekdayAtOrdinalPosition(date, dayOfWeek, nthWeekday)!.getDate(),
    });
  }
  return date;
};

export const getNextFrequencyDate = (
  date: string,
  repeatFrequency: number,
  repeatUnit: keyof typeof REPEAT_FREQUENCY,
) => {
  const dayOfWeek = format(parseISO(date), 'iiiiii').toUpperCase();
  const nthWeekday = getWeekdayOrdinalPosition(new Date(date));

  const incrementedDate = add(parseISO(date), {
    [REPEAT_FREQUENCY_UNIT_PLURAL_LABELS[repeatUnit]]: repeatFrequency,
  });

  return toDateString(
    adjustDateForFrequency(incrementedDate, repeatUnit, dayOfWeek, nthWeekday),
  ) as string;
};

export const generateFrequencyDates = (
  startDate: string,
  endDate: string,
  repeatFrequency: number,
  repeatUnit: keyof typeof REPEAT_FREQUENCY,
) => {
  if (!startDate || !endDate) {
    return [];
  }

  let nextDate = startDate;
  const frequencyDates: string[] = [];

  while (nextDate <= endDate) {
    frequencyDates.push(nextDate);

    nextDate = getNextFrequencyDate(frequencyDates.at(-1)!, repeatFrequency, repeatUnit);
  }

  return frequencyDates;
};

export const getLastFrequencyDate = (
  startDate: string,
  repeatFrequency: number,
  repeatUnit: keyof typeof REPEAT_FREQUENCY,
  occurrence: number,
) => {
  if (!startDate || occurrence < 1) {
    return null;
  }

  let currentDate = startDate;

  for (let i = 1; i < occurrence; i++) {
    currentDate = getNextFrequencyDate(currentDate, repeatFrequency, repeatUnit);
  }

  return currentDate;
};
