import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useCallback,
} from 'react';
import { DevSettings } from 'react-native';
import { useBackend } from '../hooks';

import { readConfig, writeConfig } from '~/services/config';
interface TranslationContextData {
  debugMode: boolean;
  language: string;
  languageOptions: { label: string; value: string }[];
  onChangeLanguage: (language: string) => void;
  getTranslation: (key: string) => string;
  fetchTranslations: () => void;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

const DEFAULT_LANGUAGE = 'en';
const LANGUAGE_STORAGE_KEY = 'language';

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const { models } = useBackend();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [language, setLanguage] = useState(null);
  const [languageOptions, setLanguageOptions] = useState(null);
  const [translations, setTranslations] = useState({});

  const {
    models: { TranslatedString },
  } = useBackend();

  const initialiseLanguageState = async () => {
    // Get language options from DB, only set options if there are any present
    const languageOptionArray = await TranslatedString.getLanguageOptions();
    if (languageOptionArray.length > 0) setLanguageOptions(languageOptionArray);

    // Initial check for language from localStorage (config). If none, set a default of english
    const storedLanguage = await readConfig(LANGUAGE_STORAGE_KEY);
    if (!storedLanguage) await writeConfig(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
    setLanguage(storedLanguage || DEFAULT_LANGUAGE);
  };

  useEffect(() => {
    initialiseLanguageState();
  }, []);

  const onChangeLanguage = async (languageCode: string) => {
    await writeConfig(LANGUAGE_STORAGE_KEY, languageCode);
    setLanguage(languageCode);
  };

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }

  const fetchTranslations = async () => {
    // TODO: This is fetching translations from the previously set language, not the newly set language
    const translationObject = await models.TranslatedString.getForLanguage(language);
    setTranslations(translationObject);
  };

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
        onChangeLanguage,
        getTranslation: key => translations[key],
        fetchTranslations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
