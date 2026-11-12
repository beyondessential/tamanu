import { useApi } from '../useApi.js';
import { useQuery } from '@tanstack/react-query';

import { registerYup } from '../../utils/errorMessages';
import { route } from '@tamanu/api-client';

export const useTranslationsQuery = (language = 'en') => {
  const api = useApi();
  return useQuery(
    ['translations', language],
    () =>
      api.get(route('public/translation/:language', { language }), null, {
        showUnknownErrorToast: false,
      }),
    {
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      onSettled: registerYup,
    },
  );
};
