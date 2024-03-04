import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  ReactElement,
  useEffect,
} from 'react';
import { DevSettings } from 'react-native';
import { useBackend } from '../hooks';
import { readConfig, writeConfig } from '~/services/config';

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  languageOptions: [];
  setLanguageOptions: (languageOptions: []) => void;
  onChangeLanguage: (languageCode: string) => void;
  getTranslation: (key: string) => string;
  setLanguage: (language: string) => void;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const DEFAULT_LANGUAGE = 'en';
  const { models } = useBackend();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [translations, setTranslations] = useState({});
  const [languageOptions, setLanguageOptions] = useState(null);
  const [language, setLanguage] = useState(null);

  const getLanguageOptions = async () => {
    const languageOptionArray = await models.TranslatedString.getLanguageOptions();
    if (languageOptionArray.length > 0) setLanguageOptions(languageOptionArray);
  };

  const setLanguageState = async (languageCode: string = DEFAULT_LANGUAGE) => {
    // Get language options from DB, only set options if there are any present
    if (!languageOptions) getLanguageOptions();
    const translations = await models.TranslatedString.getForLanguage(languageCode);
    setLanguage(languageCode);
    setTranslations(translations);
  };

  useEffect(() => {
    setLanguageState(language);
  }, [language]);

  useEffect(() => {
    if (!__DEV__) return;
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        language,
        languageOptions,
        setLanguageOptions,
        getTranslation: key => translations[key],
        setLanguage,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
