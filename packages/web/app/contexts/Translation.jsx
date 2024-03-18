import React, { useContext, useState } from 'react';
import { useApi } from '../api/useApi';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

const isDev = process.env.NODE_ENV === 'development';

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const initialValue = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || 'en';
  const [storedLanguage, setStoredLanguage] = useState(initialValue);

  const { data: translations } = useTranslations(storedLanguage);

  const getTranslation = (stringId, fallback) => {
    if (!translations) return fallback;
    if (translations[stringId]) return translations[stringId];
    return fallback;
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
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
