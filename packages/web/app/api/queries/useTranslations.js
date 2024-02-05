import { useApi } from '../useApi.js';
import { useQuery } from '@tanstack/react-query';

export const useTranslations = (language = 'en') => {
  const api = useApi();
  console.log('query language', language);
  return useQuery(
    ['translations', language],
    () => {
      return api.get(`translation/${language}`);
    },
    {
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    },
  );
};
