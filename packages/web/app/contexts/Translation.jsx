import React, { useState, useContext, useEffect, useCallback } from 'react';
import { isEmpty } from 'lodash';
import { useApi } from '../api/useApi';
import { LOCAL_STORAGE_KEYS } from '../constants';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

const isDev = process.env.NODE_ENV === 'development';

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const [translations, setTranslations] = useState(null);

  const fetchTranslations = useCallback(
    async (language = 'en') => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, language);
      const recievedTranslations = await api.get(`translation/${language}`);
      setTranslations(recievedTranslations);
    },
    [api],
  );

  const getTranslation = (stringId, fallback) => {
    if (!translations) return fallback;
    if (translations[stringId]) return translations[stringId];
    // This section here is a dev tool to help populate the db with the translation ids we have defined
    // in components. It will only populate the db with English strings, so that we can then translate them.
    const storedLanguage = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE);
    if (isDev && storedLanguage === 'en') {
      api.post('translation', { stringId, fallback, text: fallback });
    }
    return fallback;
  };

  // Dev helper to stop data loss in context from hotreloads when developing
  useEffect(() => {
    if (isDev) {
      const storedLanguage = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE);
      if (isEmpty(translations) && storedLanguage) {
        fetchTranslations(storedLanguage);
      }
    }
  }, [translations, fetchTranslations]);

  return (
    <TranslationContext.Provider
      value={{
        fetchTranslations,
        getTranslation,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
