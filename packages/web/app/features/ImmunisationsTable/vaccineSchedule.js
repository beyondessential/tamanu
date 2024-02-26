import { differenceInDays, parseISO } from 'date-fns';
import { VACCINE_STATUS } from '@tamanu/constants/vaccines';

export const getDueDate = date => {
  return date;
};

// Todo: remove this mock logic after NASS-1146 is done
export const mockGetStatusLogic = date => {
  const dateObj = parseISO(date);
  const currentDate = new Date();

  const days = differenceInDays(dateObj, currentDate);
  console.log('date', days);

  switch (true) {
    case days >= 28:
      return VACCINE_STATUS.SCHEDULED;
    case days >= 7:
      return VACCINE_STATUS.UPCOMING;
    case days >= -7:
      return VACCINE_STATUS.DUE;
    case days >= 56:
      return VACCINE_STATUS.OVERDUE;
    default:
      return VACCINE_STATUS.MISSED;
  }
};
