import React, {
  createContext,
  isValidElement,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { DevSettings } from 'react-native';
import { upperFirst } from 'es-toolkit/compat';
import { registerYup } from '../helpers/yupMethods';
import { readConfig, writeConfig } from '~/services/config';
import type { LanguageOption } from '~/models/TranslatedString';
import { getEnumStringId } from '../components/Translations/TranslatedEnum';
import { getReferenceDataStringId } from '../components/Translations/TranslatedReferenceData';
import useLanguageOptionsQuery from '../hooks/queries/useLanguageOptionsQuery';
import useTranslationsQuery, { type Translations } from '../hooks/queries/useTranslationsQuery';

export type Casing = 'lower' | 'upper' | 'sentence';

type Replacements = { [key: string]: any };

export type GetTranslationFunction = (
  stringId: string,
  fallback?: string,
  translationOptions?: TranslationOptions,
) => string;

export interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
  casing?: Casing;
}

interface TranslatedReferenceDataProps {
  value: string;
  category: string;
  fallback: string;
  placeholder?: string;
}

interface TranslationContextData {
  debugMode: boolean;
  language: string;
  languageOptions: LanguageOption[] | undefined;
  getTranslation: GetTranslationFunction;
  setLanguage: (language: string) => void;
  host: string;
  setHost: (host: string) => void;
  getEnumTranslation: (enumValues: Record<string, string>, value: string) => string;
  getReferenceDataTranslation: (props: TranslatedReferenceDataProps) => string;
}

interface TranslationOptions {
  replacements?: Replacements;
  casing?: Casing;
}

// Duplicated from TranslatedText.js on desktop
export const replaceStringVariables = (
  templateString: string,
  translationOptions: TranslationOptions,
  translations?: object,
) => {
  const { replacements, casing } = translationOptions || {};
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
  if (!casing) return text;
  if (casing === 'lower') return text.toLocaleLowerCase();
  if (casing === 'upper') return text.toLocaleUpperCase();
  if (casing === 'sentence') return upperFirst(text);
  throw new Error(`applyCasing called with unhandled value: ${casing}`);
};

const TranslationContext = createContext<TranslationContextData>({
  debugMode: false,
  language: 'en',
  languageOptions: undefined,
  getTranslation: () => {
    return '';
  },
  setLanguage: () => {},
  host: null,
  setHost: () => {},
  getEnumTranslation: () => '',
  getReferenceDataTranslation: () => '',
} as TranslationContextData);

export const TranslationProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [language, setLanguageState] = useState<string | null>(null);
  const [isLanguageRestored, setIsLanguageRestored] = useState(false);
  const [host, setHost] = useState<string | null>(null);

  const { data: translations } = useTranslationsQuery(language, host);
  const { data: languageOptions } = useLanguageOptionsQuery(host);

  const setLanguage = useCallback((languageCode: string) => {
    setLanguageState(languageCode);
    void writeConfig('language', languageCode);
  }, []);

  // Keep the selected language one of the available options, defaulting to the first when
  // nothing valid is stored — e.g. a fresh install, or a language removed by a later sync
  useEffect(() => {
    if (!isLanguageRestored || !languageOptions?.length) return;
    if (language && languageOptions.some(({ languageCode }) => languageCode === language)) return;
    setLanguage(languageOptions[0].languageCode);
  }, [isLanguageRestored, language, languageOptions, setLanguage]);

  const getTranslation = (
    stringId: string,
    fallback?: string,
    translationOptions?: TranslationOptions,
  ) => {
    const translation = translations?.[stringId] ?? fallback;
    return replaceStringVariables(translation, translationOptions, translations);
  };

  const getEnumTranslation = (enumValues: Record<string, string>, value: string) => {
    const fallback = enumValues[value];
    if (fallback === undefined) return getTranslation('general.fallback.unknown', 'Unknown');

    const stringId = getEnumStringId(value, enumValues);
    return getTranslation(stringId, fallback);
  };

  const getReferenceDataTranslation = ({
    value,
    category,
    fallback,
    placeholder,
  }: TranslatedReferenceDataProps) => {
    return value
      ? getTranslation(getReferenceDataStringId(value, category), fallback)
      : placeholder;
  };

  useEffect(() => {
    registerYup(translations);
  }, [translations]);

  useEffect(() => {
    const restoreLanguage = async () => {
      const languageCode = await readConfig('language');
      setLanguageState(languageCode ?? null);
      setIsLanguageRestored(true);
    };
    restoreLanguage();
    if (!__DEV__) return;
    DevSettings.addMenuItem('Toggle translation highlighting', () =>
      setIsDebugMode(oldDebugValue => !oldDebugValue),
    );
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
        language,
        languageOptions,
        getTranslation,
        setLanguage,
        host,
        setHost,
        getEnumTranslation,
        getReferenceDataTranslation,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
