import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isEmpty } from 'es-toolkit/compat';

import { Database } from '~/infra/db';
import { translationKeys } from './queryKeys';

export interface Translations {
  [stringId: string]: string;
}

const fetchTranslations = async (
  languageCode: string,
  host: string | null,
): Promise<Translations> => {
  const localTranslations = await Database.models.TranslatedString.getForLanguage(languageCode);
  if (!isEmpty(localTranslations)) return localTranslations;
  if (!host) return {};

  // Nothing synced down yet — fall back to the public server endpoint
  const response = await fetch(`${host}/api/public/translation/${languageCode}`);
  if (!response.ok) {
    throw new Error(
      `Couldn’t fetch translations from ${host}: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
};

export default function useTranslationsQuery(
  languageCode: string | null,
  host: string | null,
  useQueryOptions: Omit<UseQueryOptions<Translations>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<Translations> {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: translationKeys.forLanguage(languageCode, host),
    queryFn: async () => await fetchTranslations(languageCode, host),
    enabled: enabled && Boolean(languageCode),
    // Keep showing the previous language while a newly selected one loads
    placeholderData: keepPreviousData,
    ...rest,
  });
}
