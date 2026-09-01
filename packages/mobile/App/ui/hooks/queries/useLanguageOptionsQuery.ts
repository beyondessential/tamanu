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

const fetchLanguageOptions = async (host: string | null | undefined): Promise<LanguageOption[]> => {
  if (host) {
    // The selected server's language list is authoritative
    try {
      return await fetchRemoteLanguageOptions(host);
    } catch {
      // Server unreachable — fall back to whatever has synced down
    }
  }
  return Database.models.TranslatedString.getLanguageOptions();
};

export default function useLanguageOptionsQuery(
  host: string | null | undefined,
  useQueryOptions: Omit<UseQueryOptions<LanguageOption[]>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<LanguageOption[]> {
  return useQuery({
    queryKey: translationKeys.languageOptions(host),
    queryFn: () => fetchLanguageOptions(host),
    refetchOnReconnect: true,
    retry: 2,
    select: collapseDefaultLanguage,
    staleTime: 60_000,
    ...useQueryOptions,
  });
}
