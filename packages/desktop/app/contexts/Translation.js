import React, { useState, useContext, useEffect, useCallback } from 'react';
import { isEmpty } from 'lodash';
import { useApi } from '../api/useApi';
import { LOCAL_STORAGE_KEYS } from '../constants/localStorageKeys';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const [translations, setTranslations] = useState({});

  const fetchTranslations = useCallback(
    async language => {
      const recievedTranslations = await api.get(`translation/${language}`);
      setTranslations({ languageCode: language, ...recievedTranslations });
    },
    [api],
  );

  const getTranslation = (stringId, fallback) => {
    if (translations[stringId]) return translations[stringId];
    // This section here is a dev tool to help populate the db with the translation ids we have defined
    // in components. It will only populate the db with English strings, so that we can then translate them.
    if (process.env.NODE_ENV === 'development' && translations.languageCode === 'en') {
      api.post('translation', { stringId, fallback, text: fallback });
    }
    return fallback;
  };

  // This likely shouldnt be needed in prod? This is to help with development with lots of autorefeshing
  // which interferres with the workflow of login fetching language and storing to context
  useEffect(() => {
    const storedLanguage = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE);
    if (isEmpty(translations) && storedLanguage) {
      fetchTranslations(storedLanguage);
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
