import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useFacilityLocationAssignmentsQuery = (params, options = {}) => {
  const api = useApi();

  return useQuery(
    ['facilityLocationAssignments', params],
    () => api.get('locationAssignments', { ...params }),
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