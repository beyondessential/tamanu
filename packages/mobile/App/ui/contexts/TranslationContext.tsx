import React, { createContext, useContext, useState, PropsWithChildren, ReactElement, useEffect } from 'react';
import { DevSettings } from 'react-native';

import { readConfig, writeConfig } from '~/services/config';

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  onChangeLanguage: (language: string) => void;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

const DEFAULT_LANGUAGE = 'en';
const LANGUAGE_STORAGE_KEY = 'language';

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [language, setLanguage] = useState(null);

  // Initial check for language from localStorage (config). If none, set a default of english
  useEffect(() => {
    (async () => {
      const storedLanguage = await readConfig(LANGUAGE_STORAGE_KEY);
      if (!storedLanguage) await writeConfig(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
      setLanguage(storedLanguage || DEFAULT_LANGUAGE);
    })()
  }, [])

  const onChangeLanguage = async (languageCode: string) => {
    await writeConfig(LANGUAGE_STORAGE_KEY, languageCode);
    setLanguage(languageCode);
  }

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        language,
        onChangeLanguage,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
