import {
  add as addDuration,
  formatDuration,
  differenceInWeeks,
  differenceInYears,
  intervalToDuration,
  differenceInMonths,
  differenceInDays,
} from 'date-fns';

// NB: If you're trying to format a date as a string:
// - if you're storing it or communicating with it, you should keep it as a
//   native date object if possible
// - if you're displaying it to a user, you should use the DateDisplay component
//   instead, it'll help keep date rendering consistent throughout the app

export function getAgeFromDate(date) {
  return differenceInYears(new Date(), new Date(date));
}

const getDifferenceFnByUnit = {
  years: differenceInYears,
  months: differenceInMonths,
  weeks: differenceInWeeks,
  days: differenceInDays,
};

export function getAgeDurationFromDate(date) {
  return intervalToDuration({ start: new Date(date), end: new Date() });
}

const comparators = {
  '>': (left, right) => left > right,
  '<': (left, right) => left < right,
  '>=': (left, right) => left >= right,
  '<=': (left, right) => left <= right,
};

function compareDate(leftDate, operator, rightDate, exclusive) {
  let comparator = operator;
  if (!exclusive) {
    comparator += '=';
  }
  const comparatorFn = comparators[comparator];

  return comparatorFn(leftDate, rightDate);
}

function birthDateIsWithinRange(birthDate, range) {
  const { min = {}, max = {} } = range;
  const { duration: minDuration, exclusive: minExclusive } = min;
  const { duration: maxDuration, exclusive: maxExclusive } = max;
  const minDate = addDuration(birthDate, minDuration);
  const maxDate = addDuration(birthDate, maxDuration);
  const now = new Date();

  return (
    compareDate(minDate, '<', now, minExclusive) && compareDate(now, '<', maxDate, maxExclusive)
  );
}

/**
 * Display age in days, weeks, months or years */
export function getDisplayAge(dateOfBirth, ageDisplayFormat) {
  if (!ageDisplayFormat) {
    return '';
  }

  const ageDuration = getAgeDurationFromDate(dateOfBirth);
  const birthDate = new Date(dateOfBirth);

  for (const displayFormat of ageDisplayFormat) {
    const { as, range } = displayFormat;
    if (birthDateIsWithinRange(birthDate, range)) {
      const differenceFn = getDifferenceFnByUnit[as];
      const value = differenceFn(new Date(), birthDate);

      const unit = as.slice(0, -1); // slice off the s
      return `${value} ${unit}${value <= 1 ? '' : 's'}`;
    }
  }

  return formatDuration(ageDuration, { format: ['years'] });
}
