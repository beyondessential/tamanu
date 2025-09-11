import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import {
  LOCATION_ASSIGNMENTS_CALENDAR_ID,
  THIS_WEEK_ID,
} from '../../../constants/locationAssignments';

export const generateIdFromCell = ({ locationId, date }) =>
  `location-assignments-cell-${locationId}-${formatISO(date, { representation: 'date' })}`;

export const scrollToThisWeek = scrollIntoViewOptions =>
  document
    .getElementById(THIS_WEEK_ID)
    ?.scrollIntoView({ inline: 'start', ...scrollIntoViewOptions });

export const scrollToBeginning = scrollToOptions => {
  const calendarElement = document.getElementById(LOCATION_ASSIGNMENTS_CALENDAR_ID);
  return calendarElement?.scroll({ left: 0, ...scrollToOptions });
};

export const scrollToCell = (cell, scrollIntoViewOptions) =>
  document
    .getElementById(generateIdFromCell(cell))
    ?.scrollIntoView({ inline: 'start', ...scrollIntoViewOptions });

export const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};
