import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { keyBy, mapValues, uniq } from 'es-toolkit';

import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';
import { Database } from '~/infra/db';
import type { LanguageOption } from '~/models/TranslatedString';
import { fetchJson } from './fetchJson';
import { translationKeys } from './queryKeys';

interface TranslatedLanguageField {
  language: string;
  text: string;
}

interface LanguageOptionsResponse {
  languageNames?: TranslatedLanguageField[];
  languagesInDb?: { language: string }[];
  countryCodes?: TranslatedLanguageField[];
}

const applyDefaultsToTranslations = ({
  [DEFAULT_LANGUAGE_CODE]: defaultText,
  [ENGLISH_LANGUAGE_CODE]: enText,
  ...rest
}) => ({
  ...rest,
  [ENGLISH_LANGUAGE_CODE]: enText || defaultText,
});

const toLanguageOptions = ({
  languageNames = [],
  languagesInDb = [],
  countryCodes = [],
}: LanguageOptionsResponse): LanguageOption[] => {
  const languageDisplayNames = applyDefaultsToTranslations(
    mapValues(
      keyBy(languageNames, ({ language }) => language),
      ({ text }) => text,
    ),
  );
  const languageCountryCodes = applyDefaultsToTranslations(
    mapValues(
      keyBy(countryCodes, ({ language }) => language),
      ({ text }) => text,
    ),
  );
  return uniq(
    languagesInDb.map(({ language }) =>
      language === DEFAULT_LANGUAGE_CODE ? ENGLISH_LANGUAGE_CODE : language,
    ),
  ).map(language => ({
    label: languageDisplayNames[language],
    languageCode: language,
    countryCode: languageCountryCodes[language] ?? '',
  }));
};

// Hide the default (fallback) language when a custom English language exists
const collapseDefaultLanguage = (languageOptions: LanguageOption[]): LanguageOption[] => {
  if (languageOptions.some(({ languageCode }) => languageCode === ENGLISH_LANGUAGE_CODE)) {
    return languageOptions.filter(({ languageCode }) => languageCode !== DEFAULT_LANGUAGE_CODE);
  }
  return languageOptions;
};

const fetchRemoteLanguageOptions = async (host: string): Promise<LanguageOption[]> =>
  toLanguageOptions(
    await fetchJson<LanguageOptionsResponse>(`${host}/api/public/translation/languageOptions`),
  );

/** The languages offered by the selected server. Authoritative whenever it can be reached. */
export default function useLanguageOptionsQuery(
  host: string | null | undefined,
  useQueryOptions: Omit<UseQueryOptions<LanguageOption[]>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<LanguageOption[]> {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: translationKeys.languageOptions(host),
    queryFn: () => fetchRemoteLanguageOptions(host),
    enabled: enabled && Boolean(host),
    refetchOnReconnect: true,
    retry: 2,
    select: collapseDefaultLanguage,
    staleTime: 60_000,
    ...rest,
  });
}

/**
 * The languages that have synced down to this device. Serves as a fallback when no server is
 * selected or the selected server can’t be reached.
 */
export function useLocalLanguageOptionsQuery(
  useQueryOptions: Omit<UseQueryOptions<LanguageOption[]>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<LanguageOption[]> {
  return useQuery({
    queryKey: translationKeys.localLanguageOptions(),
    queryFn: () => Database.models.TranslatedString.getLanguageOptions(),
    select: collapseDefaultLanguage,
    ...useQueryOptions,
  });
}
