import React, { useContext, useState } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { getCurrentLanguageCode } from '../utils/translation';
import { getEnumPrefix } from '@tamanu/shared/utils/enumRegistry';

export const TranslationContext = React.createContext(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation has been called outside a TranslationProvider.');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslations(storedLanguage);

  const translationFunc = translationFactory(translations);

  const getTranslation = (stringId, fallback, replacements, uppercase, lowercase, upperFirst) => {
    const { value } = translationFunc(
      stringId,
      fallback,
      replacements,
      uppercase,
      lowercase,
      upperFirst,
    );
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
