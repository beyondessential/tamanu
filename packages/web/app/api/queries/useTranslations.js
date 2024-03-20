import { useApi } from '../useApi.js';
import { useQuery } from '@tanstack/react-query';

import { registerYup } from '../../utils/errorMessages.js';

export const useTranslations = (language = 'en') => {
  const api = useApi();
  return useQuery(
    ['translations', language],
    () => {
      return api.get(`/public/translation/${language}`);
    },
    {
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      onSettled: registerYup,
    },
  );
};
