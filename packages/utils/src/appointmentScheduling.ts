import { DAYS_OF_WEEK, REPEAT_FREQUENCY, REPEAT_FREQUENCY_UNIT_PLURAL_LABELS } from '@tamanu/constants';
import { isSameDay, add, parseISO, set, format, addMonths } from 'date-fns';
import { eachDayInMonth, toDateString } from './dateTime';

export const eachWeekdayInMonth = (date: Date, weekday = date.getDay()) =>
  eachDayInMonth(date).filter((day) => day.getDay() === weekday);

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
  const nthWeekday = matchingWeekdays.findIndex((day) => isSameDay(day, date)) + 1;
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

  return toDateString(adjustDateForFrequency(incrementedDate, repeatUnit, dayOfWeek, nthWeekday)) as string;
};

export const generateFutureAssignmentDates = (
  date: string,
  repeatFrequency: number,
  repeatUnit: keyof typeof REPEAT_FREQUENCY,
  repeatEndDate?: string,
  maxViewableMonthsAhead = 12,
) => {
  const maxGenerationDate = toDateString(addMonths(new Date(), maxViewableMonthsAhead));
  if (!maxGenerationDate) {
    throw new Error('Assignment date is not a valid date');
  }
  
  const endGenerationDate = repeatEndDate && repeatEndDate < maxGenerationDate
    ? repeatEndDate
    : maxGenerationDate;
  
  let nextAssignmentDate = getNextFrequencyDate(date, repeatFrequency, repeatUnit);
  const assignmentDates: string[] = [];

  while (endGenerationDate >= nextAssignmentDate) {
    assignmentDates.push(nextAssignmentDate);

    nextAssignmentDate = getNextFrequencyDate(
      assignmentDates.at(-1)!, repeatFrequency, repeatUnit
    );
  }

  return assignmentDates;
}