import { useQuery } from "@tanstack/react-query";
import { useAuth } from '../../contexts/Auth';
import { useApi } from "../useApi";


export const useSuggestionsQuery = (endpoint, options = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(
    ['suggestions', endpoint, facilityId],
    () => api.get(`suggestions/${endpoint}`, { noLimit: 'true', facilityId }),
    {
      enabled: !!endpoint,
      ...options,
    },
  );
};
