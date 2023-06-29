import { formatDuration } from 'date-fns';
import { getAgeDurationFromDate } from '@tamanu/shared/utils/date';

// Import all the shared date time utils here for backwards compatibility
export * from '@tamanu/shared/utils/dateTime';

/**
 * Display age in days if patient is less than 1 month old
 * Display age in months if age is between 1 month and 23 months old
 * Display age in years if patient is greater than or equal to 2 years old
 */
export function getDisplayAge(dateOfBirth) {
  const ageDuration = getAgeDurationFromDate(dateOfBirth);
  const { years, months } = ageDuration;

  if (years === 0 && months === 0) {
    return formatDuration(ageDuration, { format: ['days'] });
  }
  if (years < 2) {
    return formatDuration(ageDuration, { format: ['months'] });
  }
  return formatDuration(ageDuration, { format: ['years'] });
}
