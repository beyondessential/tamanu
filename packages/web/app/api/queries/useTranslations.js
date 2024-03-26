import { useApi } from '../useApi.js';
import { useQuery } from '@tanstack/react-query';

export const useTranslations = (language = 'en') => {
  const api = useApi();
  return useQuery(
    ['translations', language],
    () => api.get(`public/translation/${language}`, null, { showUnknownErrorToast: false }),
    {
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60, // 1 hour
    },
  );
};
