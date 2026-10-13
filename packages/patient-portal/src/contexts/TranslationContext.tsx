//@ts-nocheck
import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEnumStringId, TranslationContext } from '@tamanu/ui-components';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';

/** The portal has no language choice yet, so it uses the deployment's default language. */
const PORTAL_LANGUAGE = 'default';

/**
 * The deployment's strings for the portal's language. Until they load, or if they can't, every
 * string is its English fallback.
 */
const useTranslationsQuery = () =>
  useQuery({
    queryKey: ['translations', PORTAL_LANGUAGE],
    queryFn: async () => {
      const response = await fetch(`/api/public/translation/${PORTAL_LANGUAGE}`);
      if (!response.ok) throw new Error(`Translations failed to load (${response.status})`);
      return response.json();
    },
    staleTime: Infinity,
  });

export const TranslationProvider = ({ children }) => {
  const { data: translations } = useTranslationsQuery();
  const translationFunc = useMemo(() => translationFactory(translations), [translations]);

  const getTranslation = useCallback(
    (stringId, fallback, translationOptions = {}) =>
      translationFunc(stringId, fallback, translationOptions).value,
    [translationFunc],
  );

  const getEnumTranslation = useCallback(
    (enumValues, currentValue, translationOptions) =>
      translationFunc(
        getEnumStringId(currentValue ?? '', enumValues),
        enumValues?.[currentValue],
        translationOptions,
      ).value,
    [translationFunc],
  );

  const getReferenceDataTranslation = useCallback(
    ({ value, category, fallback, placeholder }) =>
      value ? getTranslation(getReferenceDataStringId(value, category), fallback) : placeholder,
    [getTranslation],
  );

  const contextValue = useMemo(
    () => ({
      getTranslation,
      getEnumTranslation,
      getReferenceDataTranslation,
      updateStoredLanguage: () => null,
      storedLanguage: PORTAL_LANGUAGE,
      translations: translations ?? {},
    }),
    [getTranslation, getEnumTranslation, getReferenceDataTranslation, translations],
  );

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};
