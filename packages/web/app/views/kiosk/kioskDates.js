import { isValid, parse } from 'date-fns';

export const MONTHS = [
  { stringId: 'general.month.january', fallback: 'January' },
  { stringId: 'general.month.february', fallback: 'February' },
  { stringId: 'general.month.march', fallback: 'March' },
  { stringId: 'general.month.april', fallback: 'April' },
  { stringId: 'general.month.may', fallback: 'May' },
  { stringId: 'general.month.june', fallback: 'June' },
  { stringId: 'general.month.july', fallback: 'July' },
  { stringId: 'general.month.august', fallback: 'August' },
  { stringId: 'general.month.september', fallback: 'September' },
  { stringId: 'general.month.october', fallback: 'October' },
  { stringId: 'general.month.november', fallback: 'November' },
  { stringId: 'general.month.december', fallback: 'December' },
];

const EARLIEST_BIRTH_YEAR = 1900;

/** A date entered as day, month (1–12) and year, as a date-only string, or null if it isn't real. */
export const toDateString = ({ day, month, year }) => {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return isValid(parse(dateString, 'yyyy-MM-dd', new Date())) ? dateString : null;
};

/** The day, month and year parts of a date-only string, for filling in the inputs again. */
export const toDateParts = dateString => {
  const [year = '', month = '', day = ''] = dateString?.split('-') ?? [];
  return { day: day.replace(/^0/, ''), month: month.replace(/^0/, ''), year };
};

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

/** "14 March 1986", with the month name in the patient's language. */
export const formatDateOfBirth = (dateString, getTranslation) => {
  const [year, month, day] = dateString.split('-');
  const { stringId, fallback } = MONTHS[Number(month) - 1];
  return `${Number(day)} ${getTranslation(stringId, fallback)} ${year}`;
};
