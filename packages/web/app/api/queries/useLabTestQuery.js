import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useLabTestQuery = labTestId => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(
    ['labTest', labTestId],
    () => api.get(`labTest/${encodeURIComponent(labTestId)}`, { facilityId }),
    { enabled: !!labTestId },
  );
};
