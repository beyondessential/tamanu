import {
  add,
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

export const getAgeDurationFromDate = (date: string | Date | null | undefined) => {
  const start = parseDate(date, 'Pacific/Auckland');
  if (!start) return null;
  return intervalToDuration({ start, end: new Date() });
};

//? Seems like these are not used anywhere
// NB: If you're trying to format a date as a string:
// - if you're storing it or communicating with it, you should keep it as a
//   native date object if possible
// - if you're displaying it to a user, you should use the DateDisplay component
//   instead, it'll help keep date rendering consistent throughout the app

// export const getAgeFromDate = (date: number | string | Date) => {
//   return differenceInYears(new Date(), new Date(date));
// };

const getDifferenceFnByUnit = {
  years: differenceInYears,
  months: differenceInMonths,
  weeks: differenceInWeeks,
  days: differenceInDays,
};

// eslint-disable-next-line no-unused-vars
const comparators: Record<string, (left: Date | number, right: Date | number) => boolean> = {
  '>': (left, right) => left > right,
  '<': (left, right) => left < right,
  '>=': (left, right) => left >= right,
  '<=': (left, right) => left <= right,
};

const compareDate = (
  leftDate: Date | number,
  operator: string,
  rightDate: Date | number,
  exclusive: boolean = false,
) => {
  let comparator = operator;
  if (!exclusive) comparator += '=';

  const comparatorFn = comparators[comparator];

  return comparatorFn?.(leftDate, rightDate) ?? false;
};

type AgeRange = {
  min?: {
    duration: Duration;
    exclusive?: boolean;
  };
  max?: {
    duration: Duration;
    exclusive?: boolean;
  };
};
const ageIsWithinRange = (birthDate: Date, range: AgeRange) => {
  const { duration: minDuration, exclusive: minExclusive } = range.min ?? {};
  const { duration: maxDuration, exclusive: maxExclusive } = range.max ?? {};
  const minDate = minDuration ? startOfDay(add(birthDate, minDuration)) : -Infinity;
  const maxDate = maxDuration ? startOfDay(add(birthDate, maxDuration)) : Infinity;
  const now = startOfDay(new Date());
  return (
    (!minDate || compareDate(minDate, '<', now, minExclusive)) &&
    (!maxDate || compareDate(now, '<', maxDate, maxExclusive))
  );
};

export type AgeDisplayFormat = {
  as: 'days' | 'weeks' | 'months' | 'years';
  range: AgeRange;
};
export const getDisplayAge = (
  dateOfBirth: string,
  ageDisplayFormat: AgeDisplayFormat[] | null | undefined,
) => {
  if (!ageDisplayFormat || !dateOfBirth || !isISOString(dateOfBirth)) {
    return '';
  }

  const ageDuration = getAgeDurationFromDate(dateOfBirth);
  if (!ageDuration) return '';
  const birthDate = parseDate(dateOfBirth, 'Pacific/Auckland');
  if (!birthDate) return '';
  for (const displayFormat of ageDisplayFormat) {
    const { as, range } = displayFormat;
    if (ageIsWithinRange(birthDate, range)) {
      const differenceFn = getDifferenceFnByUnit[as];
      const value = differenceFn(new Date(), birthDate);

      const unit = as.slice(0, -1); // slice off the s
      return `${value} ${unit}${value === 1 ? '' : 's'}`;
    }
  }

  return formatDuration(ageDuration, { format: ['years'] });
};
