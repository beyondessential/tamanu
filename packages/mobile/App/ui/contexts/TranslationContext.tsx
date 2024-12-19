import React, {
  createContext,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import { DevSettings } from 'react-native';
import { useBackend } from '../hooks';
import { isEmpty, upperFirst } from 'lodash';
import { registerYup } from '../helpers/yupMethods';
import { readConfig, writeConfig } from '~/services/config';

export enum Casing {
  Upper = 'upper',
  Lower = 'lower',
  UpperFirst = 'upperFirst',
}

type Replacements = { [key: string]: any };

export type GetTranslationFunction = (
  stringId: string,
  fallback?: string,
  replacements?: Replacements,
  casing?: Casing,
) => string;

export interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
  casing?: Casing;
}

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  languageOptions: [];
  setLanguageOptions: (languageOptions: []) => void;
  getTranslation: GetTranslationFunction;
  setLanguage: (language: string) => void;
  host: string;
  setHost: (host: string) => void;
}

interface ReplacementConfig {
  replacements?: Replacements;
  casing?: Casing;
}

// Duplicated from TranslatedText.js on desktop
export const replaceStringVariables = (
  templateString: string,
  replacementConfig: ReplacementConfig,
  translations?: object,
) => {
  const { replacements, casing } = replacementConfig || {};
  if (!replacements) return applyCasing(templateString, casing);
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      const replacement = replacements[part.slice(1)] ?? part;
      // Replacements might be a string or a translatable string component, handle each case
      if (!isValidElement(replacement)) return replacement;

      const replacementElement = replacement as ReactElement<TranslatedTextProps>;
      const translation =
        translations?.[replacementElement.props.stringId] || replacementElement.props.fallback;
      return applyCasing(translation, replacementElement.props.casing);
    })
    .join('');

  return applyCasing(result, casing);
};

// duplicated from translationFactory.js
const applyCasing = (text: string, casing: Casing) => {
  if (casing === Casing.Lower) return text.toLowerCase();
  if (casing === Casing.Upper) return text.toUpperCase();
  if (casing === Casing.UpperFirst) return upperFirst(text);
  return text;
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
    await writeLanguage(languageCode);
    if (!languageOptions) getLanguageOptions();
    const translations = await models.TranslatedString.getForLanguage(languageCode);
    if (isEmpty(translations) && host) {
      // If we dont have translations synced down, fetch from the public server endpoint directly
      const response = await fetch(`${host}/api/public/translation/${languageCode}`);
      const data = await response.json();
      setTranslations(data);
    } else {
      setTranslations(translations);
    }
  };

  const getTranslation = (
    stringId: string,
    fallback?: string,
    replacements?: Replacements,
    casing?: Casing,
  ) => {
    const replacementConfig = {
      replacements,
      casing,
    };
    if (!translations) return replaceStringVariables(fallback, replacementConfig, translations);
    const translation = translations[stringId] ?? fallback;

    return replaceStringVariables(translation, replacementConfig, translations);
  };

  const writeLanguage = async (languageCode: string) => {
    await writeConfig('language', languageCode);
  };

  const restoreLanguage = async () => {
    const languageCode = await readConfig('language');
    setLanguage(languageCode || DEFAULT_LANGUAGE);
  };

  useEffect(() => {
    registerYup(translations);
  }, [translations]);

  useEffect(() => {
    setLanguageState(language);
  }, [language, host]);

  useEffect(() => {
    restoreLanguage();
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
