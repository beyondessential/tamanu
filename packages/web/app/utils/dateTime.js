import { add, isSameDay, parseISO } from 'date-fns';

import { getDateDisplay } from '../components';
export { getDateDisplay } from '../components';

// Import all the shared date time utils here for backwards compatibility
export * from '@tamanu/utils/date';
export * from '@tamanu/utils/dateTime';

export const formatDateTimeRange = (start, end) => {
  const formattedStart = getDateDisplay(start, {
    showDate: true,
    showTime: true,
  });

  if (!end) return formattedStart;

  const doesSpanMultipleDays = !isSameDay(parseISO(start), parseISO(end));
  const formattedEnd = getDateDisplay(end, {
    showDate: doesSpanMultipleDays,
    showTime: true,
  });

  // eslint-disable-next-line no-irregular-whitespace
  return `${formattedStart} – ${formattedEnd}`;
  //                        ^ en dash
  //                       ^ nonbreaking space
};

export const getEndDate = (startDate, durationValue, durationUnit) => {
  const parsedStartDate = parseISO(startDate);
  const duration = parseInt(durationValue, 10);
  return add(parsedStartDate, { [durationUnit]: duration });
};
