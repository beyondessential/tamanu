import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { keyBy, mapValues, uniq } from 'es-toolkit';

import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';
import type { LanguageOption } from '~/models/TranslatedString';
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
    countryCode: languageCountryCodes[language] ?? null,
  }));
};

const fetchLanguageOptions = async (host: string): Promise<LanguageOption[]> => {
  const response = await fetch(`${host}/api/public/translation/languageOptions`);
  if (!response.ok) {
    throw new Error(`Could not fetch language options from ${host}: ${response.status}`);
  }
  return toLanguageOptions(await response.json());
};

export default function useLanguageOptionsQuery(
  host: string | null | undefined,
  useQueryOptions: Omit<UseQueryOptions<LanguageOption[]>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<LanguageOption[]> {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: translationKeys.languageOptions(host),
    queryFn: () => fetchLanguageOptions(host),
    enabled: enabled && Boolean(host),
    refetchOnReconnect: true,
    retry: 2,
    staleTime: 60_000,
    ...rest,
  });
}
