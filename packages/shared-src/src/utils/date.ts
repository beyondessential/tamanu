import { differenceInYears } from 'date-fns';

// NB: If you're trying to format a date as a string:
// - if you're storing it or communicating with it, you should keep it as a
//   native date object if possible
// - if you're displaying it to a user, you should use the DateDisplay component
//   instead, it'll help keep date rendering consistent throughout the app

export function getAgeFromDate(date: Date): number {
  return differenceInYears(new Date(), new Date(date));
}
