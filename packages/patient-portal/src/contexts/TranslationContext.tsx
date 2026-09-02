import React, { useCallback, useMemo, useState } from 'react';

import { type Translations } from '@tamanu/shared/schemas/patientPortal';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { TranslationContext, getCurrentLanguageCode, getEnumStringId } from '@tamanu/ui-components';
import { useTranslationsQuery } from '@api/queries/useTranslationsQuery';

/** Must match the key read by `getCurrentLanguageCode` in `@tamanu/ui-components`. */
const LANGUAGE_STORAGE_KEY = 'language';

interface TranslationOptions {
  replacements?: Record<string, unknown>;
  casing?: 'lower' | 'upper' | 'sentence';
}

interface ReferenceDataTranslationArgs {
  value?: string | null;
  category: string;
  fallback?: string;
  placeholder?: string;
}

export interface TranslationContextValue {
  getTranslation: (
    stringId: string,
    fallback?: string,
    translationOptions?: TranslationOptions,
  ) => string;
  getEnumTranslation: (
    enumValues: Record<string, string>,
    currentValue: string,
    translationOptions?: TranslationOptions,
  ) => string;
  getReferenceDataTranslation: (args: ReferenceDataTranslationArgs) => string | undefined;
  updateStoredLanguage: (newLanguage: string) => void;
  storedLanguage: string;
  translations: Translations | undefined;
}

interface TranslationProviderProps {
  children: React.ReactNode;
}

// `TranslationContext` is created in JavaScript with a `null` default, so TypeScript infers
// `Context<null>`. Narrow it to the value shape this provider supplies.
const TypedTranslationContext = TranslationContext as React.Context<TranslationContextValue | null>;

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [storedLanguage, setStoredLanguage] = useState<string>(getCurrentLanguageCode());
  const { data: translations } = useTranslationsQuery(storedLanguage);

  // While translations are loading (or unavailable) the factory returns fallbacks,
  // so the app renders immediately rather than waiting on the request.
  const translationFunc = useMemo(() => translationFactory(translations), [translations]);

  const getTranslation = useCallback<TranslationContextValue['getTranslation']>(
    (stringId, fallback, translationOptions = {}) => {
      const { value } = translationFunc(stringId, fallback, translationOptions);
      return value;
    },
    [translationFunc],
  );

  const getEnumTranslation = useCallback<TranslationContextValue['getEnumTranslation']>(
    (enumValues, currentValue, translationOptions) => {
      const fallback = enumValues[currentValue];
      const stringId = getEnumStringId(currentValue ?? '', enumValues);
      const { value } = translationFunc(stringId, fallback, translationOptions);
      return value;
    },
    [translationFunc],
  );

  const getReferenceDataTranslation = useCallback<
    TranslationContextValue['getReferenceDataTranslation']
  >(
    ({ value, category, fallback, placeholder }) =>
      value ? getTranslation(getReferenceDataStringId(value, category), fallback) : placeholder,
    [getTranslation],
  );

  const updateStoredLanguage = useCallback((newLanguage: string) => {
    // Local state re-renders the tree; local storage persists the choice between sessions
    setStoredLanguage(newLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
  }, []);

  const contextValue: TranslationContextValue = {
    getTranslation,
    getEnumTranslation,
    getReferenceDataTranslation,
    updateStoredLanguage,
    storedLanguage,
    translations,
  };

  return (
    <TypedTranslationContext.Provider value={contextValue}>
      {children}
    </TypedTranslationContext.Provider>
  );
};
