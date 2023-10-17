import React, { useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [translations, setTranslations] = useState({});

  const reduxTranslations = useSelector(state => state.auth.translations);

  useEffect(() => {
    setTranslations(reduxTranslations);
  }, [reduxTranslations]);

  return (
    <TranslationContext.Provider
      value={{
        getTranslation: stringId => get(translations, stringId),
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
