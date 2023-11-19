import React, { createContext, useContext, useState, PropsWithChildren, ReactElement, useEffect } from 'react';
import { DevSettings } from 'react-native';

import { readConfig, writeConfig } from '~/services/config';

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  setLanguage: (language: string) => void;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [language, setLanguage] = useState(null);

  useEffect(() => {
    const checkForStoredLanguage = async () => {
      const DEFAULT_LANGUAGE = 'en';
      const storedLanguage = await readConfig('language');
      if (!storedLanguage) await writeConfig('language', DEFAULT_LANGUAGE); // If no language set, set a default of english
      setLanguage(storedLanguage || DEFAULT_LANGUAGE);
    }
    checkForStoredLanguage();
  }, [])

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        language,
        setLanguage,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
