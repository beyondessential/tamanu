import { useQuery } from "@tanstack/react-query";
import { useApi } from "../useApi";


export const useSuggestionsQuery = (endpoint, options = {}) => {
  const api = useApi();

  return useQuery(
    ['suggestions', endpoint],
    () => api.get(`suggestions/${endpoint}`, { noLimit: 'true' }),
    {
      enabled: !!endpoint,
      ...options,
    },
  );
};
