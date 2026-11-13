import { useQuery } from '@tanstack/react-query';
import { type PortalProfiles } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useProfilesQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, PortalProfiles>({
    queryKey: ['profiles'],
    queryFn: () => api.get('profiles'),
  });
};
