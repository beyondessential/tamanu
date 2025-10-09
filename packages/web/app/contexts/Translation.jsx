import React, { useState } from 'react';
import { TranslationContext, useTranslation } from '@tamanu/ui-components';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslationsQuery } from '../api/queries/useTranslationsQuery';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { getCurrentLanguageCode } from '../utils/translation';
import { getEnumPrefix } from '@tamanu/shared/utils/enumRegistry';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';

export { useTranslation };

export const TranslationProvider = ({ children, value }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslationsQuery(storedLanguage);

  // In the case of mocking the translation context, we can pass in the value directly
  if (value) {
    return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
  }

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

  const getReferenceDataTranslation = ({ value, category, fallback, placeholder }) => {
    return value
      ? getTranslation(getReferenceDataStringId(value, category), fallback)
      : placeholder;
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
