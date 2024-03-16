/* eslint-disable no-undef */
import React, { createContext, useContext, useMemo } from 'react';

const LanguageContext = createContext({});

export const getDefaultLanguage = () => {
  // in client
  if (typeof window === 'object' && 'localStorage' in window) {
    return window.localStorage.getItem('language');
  }
};

export const useLanguageContext = () => {
  const ctx = useContext(LanguageContext);
  return ctx;
};

export const withLanguageContext = Component => props => {
  const context = useLanguageContext();
  const { language, ...other } = props;

  const contextValue = useMemo(() => {
    return {
      get language() {
        return language || getDefaultLanguage();
      },
    };
  }, [language]);

  // unsure that we are using only one provider for the component tree
  return 'language' in context ? (
    <Component {...other} />
  ) : (
    <LanguageContext.Provider value={contextValue}>
      <Component {...other} />
    </LanguageContext.Provider>
  );
};
