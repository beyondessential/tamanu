import React, { useState, useContext } from 'react';
import { get } from 'lodash';
import { useApi } from '../api';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const [translations, setTranslations] = useState({});

  const fetchTranslations = async language => {
    const storedLanguage = localStorage.getItem('language');
    const storedTranslations = localStorage.getItem('translations');
    if (storedTranslations && storedLanguage === language) {
      setTranslations(JSON.parse(storedTranslations));
      return;
    }
    const recievedTranslations = await api.get(`translation/${language}`);
    setTranslations(recievedTranslations);
    localStorage.setItem('translations', JSON.stringify(recievedTranslations));
  };

  return (
    <TranslationContext.Provider
      value={{
        fetchTranslations,
        getTranslation: stringId => get(translations, stringId),
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
