import { useQuery } from '@tanstack/react-query';
import { type Translations } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

const ONE_HOUR_IN_MS = 1000 * 60 * 60;

export const useTranslationsQuery = (language: string) => {
  const api = useApi();
  return useQuery<unknown, Error, Translations>({
    queryKey: ['translations', language],
    queryFn: () => api.get(`translation/${language}`),
    staleTime: ONE_HOUR_IN_MS,
    gcTime: ONE_HOUR_IN_MS,
  });
};
