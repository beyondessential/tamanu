import React, { useState, useContext } from 'react';
import { get } from 'lodash';

const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [translations, setTranslations] = useState({});

  return (
    <TranslationContext.Provider
      value={{
        setTranslations,
        getTranslation: stringId => get(translations, stringId),
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
