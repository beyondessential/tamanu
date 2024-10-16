import { areSameDay } from '@tamanu/shared/utils/dateTime';
import { getDateDisplay } from '../DateDisplay';
import { parseISO } from 'date-fns';

export const formatDateRange = (start, end) => {
  const formattedStart = getDateDisplay(start, { showDate: true, showTime: true });
  const formattedEnd = getDateDisplay(end, {
    showDate: !areSameDay(parseISO(start), parseISO(end)),
    showTime: true,
  });

  return `${formattedStart} - ${formattedEnd}`;
};
