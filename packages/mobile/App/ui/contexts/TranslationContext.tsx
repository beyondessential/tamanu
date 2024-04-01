import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  ReactElement,
  useEffect,
  ReactNode,
} from 'react';
import { DevSettings } from 'react-native';
import { useBackend } from '../hooks';

type Replacements = { [key: string]: ReactNode };
export interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
}

interface TranslationContextData {
  debugMode: boolean;
  getTranslation: (props: TranslatedTextProps) => string;
  fetchTranslations: () => void;
}

// Duplicated from TranslatedText.js on desktop
const replaceStringVariables = (templateString: string, replacements?: Replacements) => {
  if (!replacements) return templateString;
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      return replacements[part.slice(1)] || part;
    })
    .join('');

  return result;
};

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const { models } = useBackend();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [translations, setTranslations] = useState({});

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }

  const fetchTranslations = async (language: string = 'en') => {
    const translations = await models.TranslatedString.getForLanguage(language);
    setTranslations(translations);
  };

  const getTranslation = ({ stringId, fallback, replacements }: TranslatedTextProps) => {
    const translation = translations[stringId] || fallback;
    return replaceStringVariables(translation, replacements);
  };

  useEffect(() => {
    if (!__DEV__) return;
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        getTranslation,
        fetchTranslations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
