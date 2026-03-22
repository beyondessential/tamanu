import React, { useState, useCallback, useMemo } from 'react';
import { TranslationContext, useTranslation } from '@tamanu/ui-components';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslationsQuery } from '../api/queries/useTranslationsQuery';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { getCurrentLanguageCode } from '../utils/translation';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { getEnumStringId } from '../components/Translation/TranslatedEnum';

export { useTranslation };

export const TranslationProvider = ({ children, value }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());
  const { data: translations } = useTranslationsQuery(storedLanguage);

  const translationFunc = useMemo(() => translationFactory(translations), [translations]);

  /**
   * @param {string} stringId
   * @param {string} fallback
   * @param {TranslationOptions} translationOptions
   * @returns {string}
   */
  const getTranslation = useCallback((stringId, fallback, translationOptions = {}) => {
    const { value } = translationFunc(stringId, fallback, translationOptions);
    return value;
  }, [translationFunc]);

  const getEnumTranslation = useCallback((enumValues, currentValue) => {
    const fallback = enumValues[currentValue];
    const stringId = getEnumStringId(currentValue ?? '', enumValues);
    const { value } = translationFunc(stringId, fallback);
    return value;
  }, [translationFunc]);

  const getReferenceDataTranslation = useCallback(({ value, category, fallback, placeholder }) => {
    return value
      ? getTranslation(getReferenceDataStringId(value, category), fallback)
      : placeholder;
  }, [getTranslation]);

  const updateStoredLanguage = newLanguage => {
    // Save the language in local state so that it updates the react component tree on change
    setStoredLanguage(newLanguage);
    // Save the language in local storage so that it persists between sessions
    localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, newLanguage);
  };

  // In the case of mocking the translation context, we can pass in the value directly
  if (value) {
    return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
  }

  return (
    <TranslationContext.Provider
      value={{
        getTranslation,
        getEnumTranslation,
        getReferenceDataTranslation,
        updateStoredLanguage,
        storedLanguage,
        translations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
