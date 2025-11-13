import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationAssignmentsQuery = (params, options = {}) => {
  const api = useApi();

  return useQuery(
    ['locationAssignments', params],
    () => api.get('admin/location-assignments', { ...params }),
    {
      ...options,
      select: (data) => ({
        ...data,
        data: data?.data?.map(assignment => ({
          ...assignment,
          startTime: `${assignment.date} ${assignment.startTime}`,
          endTime: `${assignment.date} ${assignment.endTime}`,
        })),
      }),
    },
  );
};
