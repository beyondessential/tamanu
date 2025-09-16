import { useMemo } from 'react';
import { useAuth, useApi } from '../../contexts';
import { Suggester } from './Suggester';

export const useSuggester = (type, options) => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useMemo(
    () =>
      new Suggester(api, type, {
        ...options,
        baseQueryParameters: { facilityId, ...options?.baseQueryParameters },
      }),
    [api, type, facilityId, options],
  );
};
