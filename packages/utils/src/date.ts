/* eslint-disable no-unused-vars */
import {
  add as addDuration,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  formatDuration,
  intervalToDuration,
  startOfDay,
  type Duration,
} from 'date-fns';
import { isISOString, parseDate } from './dateTime';

// NB: If you're trying to format a date as a string:
// - if you're storing it or communicating with it, you should keep it as a
//   native date object if possible
// - if you're displaying it to a user, you should use the DateDisplay component
//   instead, it'll help keep date rendering consistent throughout the app

export function getAgeFromDate(date: string | Date): number {
  return differenceInYears(new Date(), new Date(date));
}

const getDifferenceFnByUnit: Record<string, (dateLeft: Date, dateRight: Date) => number> = {
  years: differenceInYears,
  months: differenceInMonths,
  weeks: differenceInWeeks,
  days: differenceInDays,
};

export function getAgeDurationFromDate(date: string | Date) {
  const start = parseDate(date);
  if (!start) throw new Error('Invalid date');
  return intervalToDuration({ start, end: new Date() });
}

const comparators: Record<string, (left: Date, right: Date) => boolean> = {
  '>': (left, right) => left > right,
  '<': (left, right) => left < right,
  '>=': (left, right) => left >= right,
  '<=': (left, right) => left <= right,
};

function compareDate(leftDate: Date, operator: string, rightDate: Date, exclusive: boolean) {
  let comparator = operator;
  if (!exclusive) comparator += '=';

  const comparatorFn = comparators[comparator];

  if (!comparatorFn) return false;
  return comparatorFn(leftDate, rightDate);
}

type AgeRange = {
  min: {
    duration?: Duration;
    exclusive?: boolean;
  };
  max: {
    duration?: Duration;
    exclusive?: boolean;
  };
};

function ageIsWithinRange(birthDate: Date, range: AgeRange): boolean {
  const { duration: minDuration, exclusive: minExclusive } = range.min;
  const { duration: maxDuration, exclusive: maxExclusive } = range.max;
  const minDate = minDuration ? startOfDay(addDuration(birthDate, minDuration)) : -Infinity;
  const maxDate = maxDuration ? startOfDay(addDuration(birthDate, maxDuration)) : Infinity;
  const now = startOfDay(new Date());
  return (
    (!minDate || compareDate(minDate as Date, '<', now, !!minExclusive)) &&
    (!maxDate || compareDate(now, '<', maxDate as Date, !!maxExclusive))
  );
}

/**
 * Display age in days, weeks, months or years
 *
 * */
export function getDisplayAge(
  dateOfBirth: string,
  ageDisplayFormat: { range: AgeRange; as: string }[],
): string {
  if (!isISOString(dateOfBirth)) return '';

  const ageDuration = getAgeDurationFromDate(dateOfBirth);
  const birthDate = parseDate(dateOfBirth);
  if (!birthDate) return '';

  for (const displayFormat of ageDisplayFormat) {
    const { as, range } = displayFormat;
    if (ageIsWithinRange(birthDate, range)) {
      const differenceFn = getDifferenceFnByUnit[as];
      if (!differenceFn) continue;

      const value = differenceFn(new Date(), birthDate);

      const unit = as.slice(0, -1); // slice off the s
      return `${value} ${unit}${value === 1 ? '' : 's'}`;
    }
  }

  return formatDuration(ageDuration, { format: ['years'] });
}
