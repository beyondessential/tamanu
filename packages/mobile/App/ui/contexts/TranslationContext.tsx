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
import { isEmpty } from 'lodash';

type Replacements = { [key: string]: any };
export interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
  uppercase?: boolean;
}

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  languageOptions: [];
  setLanguageOptions: (languageOptions: []) => void;
  getTranslation: (stringId: string, fallback?: string, replacements?: Replacements) => string;
  setLanguage: (language: string) => void;
  host: string;
  setHost: (host: string) => void;
}

// Duplicated from TranslatedText.js on desktop
const replaceStringVariables = (templateString: string, replacements?: Replacements) => {
  if (!replacements) return templateString;
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      return replacements[part.slice(1)] ?? part;
    })
    .join('');

  return result;
};

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const DEFAULT_LANGUAGE = 'en';
  const { models } = useBackend();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [translations, setTranslations] = useState({});
  const [languageOptions, setLanguageOptions] = useState(null);
  const [language, setLanguage] = useState(null);
  const [host, setHost] = useState(null);

  const getLanguageOptions = async () => {
    const languageOptionArray = await models.TranslatedString.getLanguageOptions();
    if (languageOptionArray.length > 0) setLanguageOptions(languageOptionArray);
  };

  const setLanguageState = async (languageCode: string = DEFAULT_LANGUAGE) => {
    if (!languageOptions) getLanguageOptions();
    const translations = await models.TranslatedString.getForLanguage(languageCode);
    if (isEmpty(translations)) {
      // If we dont have translations synced down, fetch from the public server endpoint directly
      const response = await fetch(`${host}/api/public/translation/${languageCode}`);
      const data = await response.json();
      setTranslations(data);
    } else {
      setTranslations(translations);
    }
  };

  const getTranslation = (stringId: string, fallback?: string, replacements?: Replacements) => {
    const translation = translations?.[stringId] || fallback;
    return replaceStringVariables(translation, replacements);
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
        getTranslation,
        setLanguage,
        host,
        setHost,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
