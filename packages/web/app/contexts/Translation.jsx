import React, { useState } from 'react';
import { TranslationContext, useTranslation } from '@tamanu/ui-components';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslationsQuery } from '../api/queries/useTranslationsQuery';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { getCurrentLanguageCode } from '../utils/translation';
import { getEnumPrefix } from '@tamanu/shared/utils/enumRegistry';

export { useTranslation };

export const TranslationProvider = ({ children }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslationsQuery(storedLanguage);

  const translationFunc = translationFactory(translations);

  /**
   * @param {string} stringId
   * @param {string} fallback
   * @param {TranslationOptions} translationOptions
   * @returns {string}
   */
  const getTranslation = (stringId, fallback, translationOptions = {}) => {
    const { value } = translationFunc(stringId, fallback, translationOptions);
    return value;
  };

  const getEnumTranslation = (enumValues, currentValue) => {
    const fallback = enumValues[currentValue];
    const stringId = `${getEnumPrefix(enumValues)}.${currentValue}`;
    const { value } = translationFunc(stringId, fallback);
    return value;
  };

  const updateStoredLanguage = newLanguage => {
    // Save the language in local state so that it updates the react component tree on change
    setStoredLanguage(newLanguage);
    // Save the language in local storage so that it persists between sessions
    localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, newLanguage);
  };

  return (
    <TranslationContext.Provider
      value={{
        getTranslation,
        getEnumTranslation,
        updateStoredLanguage,
        storedLanguage,
        translations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
