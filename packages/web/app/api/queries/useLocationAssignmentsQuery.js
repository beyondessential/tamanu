import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentsQuery = (params, options = {}) => {
  const api = useApi();

  const locationAssignmentsQuery = useQuery(
    ['locationAssignments', params],
    () => api.get('admin/location-assignments', { ...params }),
    {
      ...options,
    },
  );
  const mappedData = locationAssignmentsQuery?.data?.data.map(assignment => ({
    ...assignment,
    startTime: `${assignment.date} ${assignment.startTime}`,
    endTime: `${assignment.date} ${assignment.endTime}`,
  }));
  return {
    ...locationAssignmentsQuery,
    data: mappedData
      ? {
          ...locationAssignmentsQuery.data,
          data: mappedData,
        }
      : undefined,
  };
};
