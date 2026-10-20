import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isEmptyObject } from 'es-toolkit';
import { Database } from '~/infra/db';
import { fetchJson } from '../hooks/queries/fetchJson';
import { translationKeys } from '../hooks/queries/queryKeys';

export interface Translations {
  [stringId: string]: string;
}

const fetchTranslations = async (
  languageCode: string,
  host: string | null,
): Promise<Translations> => {
  const localTranslations = await Database.models.TranslatedString.getForLanguage(languageCode);
  if (!isEmptyObject(localTranslations)) return localTranslations;
  if (!host) return {};
  // Nothing synced down yet; fall back to public API
  return fetchJson<Translations>(`${host}/api/public/translation/${languageCode}`);
};

export default function useTranslationsQuery(
  languageCode: string | null,
  host: string | null,
  useQueryOptions: Omit<UseQueryOptions<Translations>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<Translations> {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: translationKeys.forLanguage(languageCode, host),
    queryFn: () => fetchTranslations(languageCode, host),
    enabled: enabled && Boolean(languageCode),
    // Keep showing the previous language while a newly selected one loads
    placeholderData: keepPreviousData,
    /**
     * The remote fallback is worth retrying — a single failed fetch after a language
     * switch would otherwise drop the UI back to hardcoded fallbacks
     */
    retry: 2,
    ...rest,
  });
}
