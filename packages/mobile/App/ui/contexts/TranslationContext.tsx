import React, { createContext, useContext, useState, PropsWithChildren, ReactElement } from 'react';
import { DevSettings } from 'react-native';
import { useBackend } from '../hooks';

interface TranslationContextData {
  debugMode: boolean;
  getTranslation: (key: string) => string;
  fetchTranslations: () => void;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const { models } = useBackend();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [translations, setTranslations] = useState({} as object);

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }

  const fetchTranslations = async (language: string = 'en') => {
    const translations = await models.TranslatedString.getForLanguage(language);
    setTranslations(translations);
  };

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        getTranslation: key => translations[key],
        fetchTranslations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
