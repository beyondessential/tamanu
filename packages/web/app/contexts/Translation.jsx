import React, { useContext, useState } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { getCurrentLanguageCode } from '../utils/translation';

export const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslations(storedLanguage);

  const translationFunc = translationFactory(translations);

  const getTranslation = (stringId, fallback, replacements, uppercase, lowercase) => {
    const { value } = translationFunc(
      stringId,
      fallback,
      replacements,
      uppercase,
      lowercase,
    );
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
        updateStoredLanguage,
        storedLanguage,
        translations
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
