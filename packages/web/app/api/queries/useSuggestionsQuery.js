import { useQuery } from "@tanstack/react-query";
import { useApi } from "../useApi";


export const useSuggestionsQuery = (endpoint, options = {}) => {
  const api = useApi();
  const { queryParams = {}, ...queryOptions } = options;

  return useQuery(
    ['suggestions', endpoint, queryParams],
    () => api.get(`suggestions/${endpoint}`, { noLimit: 'true', ...queryParams }),
    {
      enabled: !!endpoint,
      ...queryOptions,
    },
  );
};
