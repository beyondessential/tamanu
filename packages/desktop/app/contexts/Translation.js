import React, { useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash';
import { useApi } from '../api';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const [language, setLanguage] = useState('en');

  const { data: translations = {} } = useQuery(['languageList', language], () =>
    api.get(`translation/${language}`),
  );

  return (
    <TranslationContext.Provider
      value={{
        setLanguage,
        getTranslation: stringId => get(translations, stringId),
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
