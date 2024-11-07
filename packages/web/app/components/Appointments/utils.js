import { getDateDisplay } from '../DateDisplay';
import { isSameDay, parseISO } from 'date-fns';

export const formatDateRange = (start, end) => {
  const formattedStart = getDateDisplay(start, { showDate: true, showTime: true });
  const formattedEnd = getDateDisplay(end, {
    showDate: !isSameDay(parseISO(start), parseISO(end)),
    showTime: true,
  });

  return `${formattedStart} - ${formattedEnd}`;
};
