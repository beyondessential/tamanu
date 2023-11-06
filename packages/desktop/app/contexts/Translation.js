import React, { useState, useContext } from 'react';
import { useApi } from '../api';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const [translations, setTranslations] = useState({});
  const [isTranslationsLoaded, setIsTranslationsLoaded] = useState(false);

  const fetchTranslations = async language => {
    const recievedTranslations = await api.get(`translation/${language}`);
    setTranslations(recievedTranslations);
    setIsTranslationsLoaded(true);
  };

  const getTranslation = (stringId, fallback) => {
    if (!isTranslationsLoaded) return 'loading...';
    if (translations[stringId]) return translations[stringId];
    // TODO: Should only do this when english
    api.post('translation', { stringId, fallback, text: fallback });
    return fallback;
  };

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
