import { formatISO } from 'date-fns';

import { THIS_WEEK_ID } from './LocationAssignmentsCalendarHeader';

export const partitionAssignmentsByLocation = (assignments) => {
  const result = {};
  for (const assignment of assignments) {
    const { locationId } = assignment;
    if (!result[locationId]) result[locationId] = [];
    result[locationId].push(assignment);
  }
  return result;
};

export const partitionAssignmentsByDate = (assignments) => {
  const result = {};
  for (const assignment of assignments) {
    const dateKey = assignment.date;
    if (!result[dateKey]) result[dateKey] = [];
    result[dateKey].push(assignment);
  }
  return result;
};

export const generateIdFromCell = ({ locationId, date }) =>
  `location-assignments-cell-${locationId}-${formatISO(date, { representation: 'date' })}`;

export const scrollToThisWeek = (scrollIntoViewOptions) =>
  document
    .getElementById(THIS_WEEK_ID)
    ?.scrollIntoView({ inline: 'start', ...scrollIntoViewOptions });

export const scrollToBeginning = (scrollToOptions) => {
  const calendarElement = document.getElementById('location-assignments-calendar');
  return calendarElement?.scroll({ left: 0, ...scrollToOptions });
};

export const scrollToCell = (cell, scrollIntoViewOptions) =>
  document
    .getElementById(generateIdFromCell(cell))
    ?.scrollIntoView({ inline: 'start', ...scrollIntoViewOptions });