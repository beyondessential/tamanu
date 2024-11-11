import { isSameDay, parseISO } from 'date-fns';
import { getDateDisplay } from '../components';

// Import all the shared date time utils here for backwards compatibility
export * from '@tamanu/shared/utils/dateTime';
export * from '@tamanu/shared/utils/date';

export const formatDateRange = (start, end) => {
  const formattedStart = getDateDisplay(start, { showDate: true, showTime: true });
  const formattedEnd = getDateDisplay(end, {
    showDate: !isSameDay(parseISO(start), parseISO(end)),
    showTime: true,
  });

  return `${formattedStart} - ${formattedEnd}`;
};
