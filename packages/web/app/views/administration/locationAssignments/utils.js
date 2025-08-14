import { formatISO } from 'date-fns';

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