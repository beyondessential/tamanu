import { parse } from 'date-fns';

import { toDateString } from '@tamanu/ui-components';

const EARLIEST_BIRTH_YEAR = 1900;

/**
 * The date of birth a patient entered, as a date-only string, or null when it isn't a real date
 * that has already happened.
 */
export const toDateOfBirth = parts => {
  const dateString = toDateString(parts);
  if (!dateString) return null;
  const isPlausible =
    parse(dateString, 'yyyy-MM-dd', new Date()) <= new Date() &&
    Number(parts.year) >= EARLIEST_BIRTH_YEAR;
  return isPlausible ? dateString : null;
};

